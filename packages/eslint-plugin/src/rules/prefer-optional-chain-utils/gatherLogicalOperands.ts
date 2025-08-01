import type {
  ParserServicesWithTypeInformation,
  TSESTree,
} from '@typescript-eslint/utils';
import type { SourceCode } from '@typescript-eslint/utils/ts-eslint';

import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import {
  isBigIntLiteralType,
  isBooleanLiteralType,
  isNumberLiteralType,
  isStringLiteralType,
  unionConstituents,
} from 'ts-api-utils';
import * as ts from 'typescript';

import type { PreferOptionalChainOptions } from './PreferOptionalChainOptions';

import { isReferenceToGlobalFunction, isTypeFlagSet } from '../../util';

const enum ComparisonValueType {
  Null = 'Null', // eslint-disable-line @typescript-eslint/internal/prefer-ast-types-enum
  Undefined = 'Undefined',
  UndefinedStringLiteral = 'UndefinedStringLiteral',
}
export const enum OperandValidity {
  Valid = 'Valid',
  Invalid = 'Invalid',
}
export const enum NullishComparisonType {
  /** `x != null`, `x != undefined` */
  NotEqualNullOrUndefined = 'NotEqualNullOrUndefined',
  /** `x == null`, `x == undefined` */
  EqualNullOrUndefined = 'EqualNullOrUndefined',

  /** `x !== null` */
  NotStrictEqualNull = 'NotStrictEqualNull',
  /** `x === null` */
  StrictEqualNull = 'StrictEqualNull',

  /** `x !== undefined`, `typeof x !== 'undefined'` */
  NotStrictEqualUndefined = 'NotStrictEqualUndefined',
  /** `x === undefined`, `typeof x === 'undefined'` */
  StrictEqualUndefined = 'StrictEqualUndefined',

  /** `!x` */
  NotBoolean = 'NotBoolean',
  /** `x` */
  Boolean = 'Boolean', // eslint-disable-line @typescript-eslint/internal/prefer-ast-types-enum
}
export interface ValidOperand {
  comparedName: TSESTree.Node;
  comparisonType: NullishComparisonType;
  isYoda: boolean;
  node: TSESTree.Expression;
  type: OperandValidity.Valid;
}
export interface InvalidOperand {
  type: OperandValidity.Invalid;
}
type Operand = InvalidOperand | ValidOperand;

const NULLISH_FLAGS = ts.TypeFlags.Null | ts.TypeFlags.Undefined;
function isValidFalseBooleanCheckType(
  node: TSESTree.Node,
  disallowFalseyLiteral: boolean,
  parserServices: ParserServicesWithTypeInformation,
  options: PreferOptionalChainOptions,
): boolean {
  const type = parserServices.getTypeAtLocation(node);
  const types = unionConstituents(type);

  if (
    disallowFalseyLiteral &&
    /*
    ```
    declare const x: false | {a: string};
    x && x.a;
    !x || x.a;
    ```

    We don't want to consider these two cases because the boolean expression
    narrows out the non-nullish falsy cases - so converting the chain to `x?.a`
    would introduce a build error
    */ (types.some(
      t => isBooleanLiteralType(t) && t.intrinsicName === 'false',
    ) ||
      types.some(t => isStringLiteralType(t) && t.value === '') ||
      types.some(t => isNumberLiteralType(t) && t.value === 0) ||
      types.some(t => isBigIntLiteralType(t) && t.value.base10Value === '0'))
  ) {
    return false;
  }

  let allowedFlags = NULLISH_FLAGS | ts.TypeFlags.Object;
  if (options.checkAny === true) {
    allowedFlags |= ts.TypeFlags.Any;
  }
  if (options.checkUnknown === true) {
    allowedFlags |= ts.TypeFlags.Unknown;
  }
  if (options.checkString === true) {
    allowedFlags |= ts.TypeFlags.StringLike;
  }
  if (options.checkNumber === true) {
    allowedFlags |= ts.TypeFlags.NumberLike;
  }
  if (options.checkBoolean === true) {
    allowedFlags |= ts.TypeFlags.BooleanLike;
  }
  if (options.checkBigInt === true) {
    allowedFlags |= ts.TypeFlags.BigIntLike;
  }
  return types.every(t => isTypeFlagSet(t, allowedFlags));
}

export function gatherLogicalOperands(
  node: TSESTree.LogicalExpression,
  parserServices: ParserServicesWithTypeInformation,
  sourceCode: Readonly<SourceCode>,
  options: PreferOptionalChainOptions,
): {
  newlySeenLogicals: Set<TSESTree.LogicalExpression>;
  operands: Operand[];
} {
  const result: Operand[] = [];
  const { newlySeenLogicals, operands } = flattenLogicalOperands(node);

  for (const operand of operands) {
    const areMoreOperands = operand !== operands.at(-1);
    switch (operand.type) {
      case AST_NODE_TYPES.BinaryExpression: {
        // check for "yoda" style logical: null != x

        const { comparedExpression, comparedValue, isYoda } = (() => {
          // non-yoda checks are by far the most common, so check for them first
          const comparedValueRight = getComparisonValueType(operand.right);
          if (comparedValueRight) {
            return {
              comparedExpression: operand.left,
              comparedValue: comparedValueRight,
              isYoda: false,
            };
          }
          return {
            comparedExpression: operand.right,
            comparedValue: getComparisonValueType(operand.left),
            isYoda: true,
          };
        })();

        if (comparedValue === ComparisonValueType.UndefinedStringLiteral) {
          if (
            comparedExpression.type === AST_NODE_TYPES.UnaryExpression &&
            comparedExpression.operator === 'typeof'
          ) {
            const argument = comparedExpression.argument;
            if (
              argument.type === AST_NODE_TYPES.Identifier &&
              // typeof window === 'undefined'
              isReferenceToGlobalFunction(argument.name, argument, sourceCode)
            ) {
              result.push({ type: OperandValidity.Invalid });
              continue;
            }

            // typeof x.y === 'undefined'
            result.push({
              comparedName: comparedExpression.argument,
              comparisonType: operand.operator.startsWith('!')
                ? NullishComparisonType.NotStrictEqualUndefined
                : NullishComparisonType.StrictEqualUndefined,
              isYoda,
              node: operand,
              type: OperandValidity.Valid,
            });
            continue;
          }

          // y === 'undefined'
          result.push({ type: OperandValidity.Invalid });
          continue;
        }

        switch (operand.operator) {
          case '!=':
          case '==':
            if (
              comparedValue === ComparisonValueType.Null ||
              comparedValue === ComparisonValueType.Undefined
            ) {
              // x == null, x == undefined
              result.push({
                comparedName: comparedExpression,
                comparisonType: operand.operator.startsWith('!')
                  ? NullishComparisonType.NotEqualNullOrUndefined
                  : NullishComparisonType.EqualNullOrUndefined,
                isYoda,
                node: operand,
                type: OperandValidity.Valid,
              });
              continue;
            }
            // x == something :(
            result.push({ type: OperandValidity.Invalid });
            continue;

          case '!==':
          case '===': {
            const comparedName = comparedExpression;
            switch (comparedValue) {
              case ComparisonValueType.Null:
                result.push({
                  comparedName,
                  comparisonType: operand.operator.startsWith('!')
                    ? NullishComparisonType.NotStrictEqualNull
                    : NullishComparisonType.StrictEqualNull,
                  isYoda,
                  node: operand,
                  type: OperandValidity.Valid,
                });
                continue;

              case ComparisonValueType.Undefined:
                result.push({
                  comparedName,
                  comparisonType: operand.operator.startsWith('!')
                    ? NullishComparisonType.NotStrictEqualUndefined
                    : NullishComparisonType.StrictEqualUndefined,
                  isYoda,
                  node: operand,
                  type: OperandValidity.Valid,
                });
                continue;

              default:
                // x === something :(
                result.push({ type: OperandValidity.Invalid });
                continue;
            }
          }
        }

        result.push({ type: OperandValidity.Invalid });
        continue;
      }

      case AST_NODE_TYPES.UnaryExpression:
        if (
          operand.operator === '!' &&
          (!areMoreOperands ||
            isValidFalseBooleanCheckType(
              operand.argument,
              node.operator === '||',
              parserServices,
              options,
            ))
        ) {
          result.push({
            comparedName: operand.argument,
            comparisonType: NullishComparisonType.NotBoolean,
            isYoda: false,
            node: operand,
            type: OperandValidity.Valid,
          });
          continue;
        }
        result.push({ type: OperandValidity.Invalid });
        continue;

      case AST_NODE_TYPES.LogicalExpression:
        // explicitly ignore the mixed logical expression cases
        result.push({ type: OperandValidity.Invalid });
        continue;

      default:
        if (
          !areMoreOperands ||
          isValidFalseBooleanCheckType(
            operand,
            node.operator === '&&',
            parserServices,
            options,
          )
        ) {
          result.push({
            comparedName: operand,
            comparisonType: NullishComparisonType.Boolean,
            isYoda: false,
            node: operand,
            type: OperandValidity.Valid,
          });
        } else {
          result.push({ type: OperandValidity.Invalid });
        }
        continue;
    }
  }

  return {
    newlySeenLogicals,
    operands: result,
  };

  /*
  The AST is always constructed such the first element is always the deepest element.
  I.e. for this code: `foo && foo.bar && foo.bar.baz && foo.bar.baz.buzz`
  The AST will look like this:
  {
    left: {
      left: {
        left: foo
        right: foo.bar
      }
      right: foo.bar.baz
    }
    right: foo.bar.baz.buzz
  }

  So given any logical expression, we can perform a depth-first traversal to get
  the operands in order.

  Note that this function purposely does not inspect mixed logical expressions
  like `foo || foo.bar && foo.bar.baz` - separate selector
  */
  function flattenLogicalOperands(node: TSESTree.LogicalExpression): {
    newlySeenLogicals: Set<TSESTree.LogicalExpression>;
    operands: TSESTree.Expression[];
  } {
    const operands: TSESTree.Expression[] = [];
    const newlySeenLogicals = new Set<TSESTree.LogicalExpression>([node]);

    const stack: TSESTree.Expression[] = [node.right, node.left];
    let current: TSESTree.Expression | undefined;
    while ((current = stack.pop())) {
      if (
        current.type === AST_NODE_TYPES.LogicalExpression &&
        current.operator === node.operator
      ) {
        newlySeenLogicals.add(current);
        stack.push(current.right);
        stack.push(current.left);
      } else {
        operands.push(current);
      }
    }

    return {
      newlySeenLogicals,
      operands,
    };
  }

  function getComparisonValueType(
    node: TSESTree.Node,
  ): ComparisonValueType | null {
    switch (node.type) {
      case AST_NODE_TYPES.Literal:
        // eslint-disable-next-line eqeqeq, @typescript-eslint/internal/eqeq-nullish -- intentional exact comparison against null
        if (node.value === null && node.raw === 'null') {
          return ComparisonValueType.Null;
        }
        if (node.value === 'undefined') {
          return ComparisonValueType.UndefinedStringLiteral;
        }
        return null;

      case AST_NODE_TYPES.Identifier:
        if (node.name === 'undefined') {
          return ComparisonValueType.Undefined;
        }
        return null;
    }

    return null;
  }
}
