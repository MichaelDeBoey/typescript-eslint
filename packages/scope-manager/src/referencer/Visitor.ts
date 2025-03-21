import type { TSESTree } from '@typescript-eslint/types';

import type {
  PatternVisitorCallback,
  PatternVisitorOptions,
} from './PatternVisitor';
import type { VisitorOptions } from './VisitorBase';

import { PatternVisitor } from './PatternVisitor';
import { VisitorBase } from './VisitorBase';

interface VisitPatternOptions extends PatternVisitorOptions {
  processRightHandNodes?: boolean;
}
export class Visitor extends VisitorBase {
  readonly #options: VisitorOptions;
  constructor(optionsOrVisitor: Visitor | VisitorOptions) {
    super(
      optionsOrVisitor instanceof Visitor
        ? optionsOrVisitor.#options
        : optionsOrVisitor,
    );

    this.#options =
      optionsOrVisitor instanceof Visitor
        ? optionsOrVisitor.#options
        : optionsOrVisitor;
  }

  protected visitPattern(
    node: TSESTree.Node,
    callback: PatternVisitorCallback,
    options: VisitPatternOptions = { processRightHandNodes: false },
  ): void {
    // Call the callback at left hand identifier nodes, and Collect right hand nodes.
    const visitor = new PatternVisitor(this.#options, node, callback);

    visitor.visit(node);

    // Process the right hand nodes recursively.
    if (options.processRightHandNodes) {
      visitor.rightHandNodes.forEach(this.visit, this);
    }
  }
}

export { VisitorBase, type VisitorOptions } from './VisitorBase';
