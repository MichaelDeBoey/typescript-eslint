import type { AST_NODE_TYPES } from '../../../ast-node-types';
import type { LiteralBase } from '../../../base/LiteralBase';

export interface BooleanLiteral extends LiteralBase {
  type: AST_NODE_TYPES.Literal;
  value: boolean;
  raw: 'false' | 'true';
}
