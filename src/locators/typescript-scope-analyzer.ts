import * as ts from 'typescript';
import { Node } from 'ts-morph';
import { NodeAnalyzer } from './node-analyzer';

export class TypeScriptScopeAnalyzer {
  getScope(node: Node): Node {
    return NodeAnalyzer.getNodeScope(node);
  }

  isScopeNode(node: Node): boolean {
    return node.getKind() === ts.SyntaxKind.FunctionDeclaration ||
           node.getKind() === ts.SyntaxKind.FunctionExpression ||
           node.getKind() === ts.SyntaxKind.ArrowFunction ||
           node.getKind() === ts.SyntaxKind.Block ||
           node.getKind() === ts.SyntaxKind.SourceFile;
  }

  isScopeContainedIn(innerScope: Node, outerScope: Node): boolean {
    return NodeAnalyzer.isScopeContainedIn(innerScope, outerScope);
  }

  getParentScope(scope: Node): Node | undefined {
    return NodeAnalyzer.getParentScope(scope);
  }
}