import type { TSESTree } from '@typescript-eslint/types';

import type { ScopeManager } from '../ScopeManager';
import type { Scope } from './Scope';

import { FunctionNameDefinition } from '../definition';
import { ScopeBase } from './ScopeBase';
import { ScopeType } from './ScopeType';

export class FunctionExpressionNameScope extends ScopeBase<
  ScopeType.functionExpressionName,
  TSESTree.FunctionExpression,
  Scope
> {
  public override readonly functionExpressionScope: true;

  constructor(
    scopeManager: ScopeManager,
    upperScope: FunctionExpressionNameScope['upper'],
    block: FunctionExpressionNameScope['block'],
  ) {
    super(
      scopeManager,
      ScopeType.functionExpressionName,
      upperScope,
      block,
      false,
    );
    if (block.id) {
      this.defineIdentifier(
        block.id,
        new FunctionNameDefinition(block.id, block),
      );
    }
    this.functionExpressionScope = true;
  }
}
