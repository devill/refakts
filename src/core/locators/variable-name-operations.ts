import * as ts from 'typescript';
import { Node } from 'ts-morph';

export class VariableNameOperations {
  static getVariableName(node: Node): string | undefined {
    const identifier = node.getFirstDescendantByKind(ts.SyntaxKind.Identifier);
    return identifier?.getText();
  }

  static getVariableNameRequired(node: Node): string {
    const identifier = node.getFirstDescendantByKind(ts.SyntaxKind.Identifier);
    if (!identifier) {
      throw new Error('Declaration node does not contain an identifier');
    }
    return identifier.getText();
  }

  static getDeclarationIdentifier(node: Node): Node | undefined {
    return node.getFirstDescendantByKind(ts.SyntaxKind.Identifier);
  }

  static isUsageNode(node: Node, variableName: string, declarationIdentifier: Node | undefined): boolean {
    return node.getKind() === ts.SyntaxKind.Identifier && 
           node.getText() === variableName && 
           node !== declarationIdentifier;
  }

  static matchesVariableName(node: Node, variableName: string): boolean {
    const identifier = node.getFirstDescendantByKind(ts.SyntaxKind.Identifier);
    return identifier?.getText() === variableName;
  }
}