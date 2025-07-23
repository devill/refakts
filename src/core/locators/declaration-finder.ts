import * as ts from 'typescript';
import { Node } from 'ts-morph';
import { NodeContext } from '../../locators/node-context';

export class DeclarationFinder {
  static isDeclaration(node: Node): boolean {
    return node.getKind() === ts.SyntaxKind.VariableDeclaration ||
           node.getKind() === ts.SyntaxKind.Parameter;
  }

  static isAnyDeclaration(node: Node): boolean {
    return node.getKind() === ts.SyntaxKind.VariableDeclaration ||
           node.getKind() === ts.SyntaxKind.Parameter;
  }

  static findContainingDeclaration(node: Node): NodeContext | undefined {
    const nodeContext = new NodeContext(node);
    return nodeContext.findContainingDeclaration();
  }
}