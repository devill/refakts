import * as ts from 'typescript';
import { Node } from 'ts-morph';
import { NodeTypeClassifier } from '../node-type-classifier';

export class VariableNameExtractor {
  static getVariableName(declaration: Node): string | undefined {
    const identifier = declaration.getFirstDescendantByKind(ts.SyntaxKind.Identifier);
    return identifier?.getText();
  }

  static getVariableNameRequired(declaration: Node): string {
    const identifier = declaration.getFirstDescendantByKind(ts.SyntaxKind.Identifier);
    if (!identifier) {
      throw new Error('Declaration node does not contain an identifier');
    }
    return identifier.getText();
  }

  static getVariableNameFromNode(node: Node): string {
    return NodeTypeClassifier.isIdentifierNode(node) 
      ? node.getText() 
      : this.extractCandidateNameOrThrow(node);
  }

  static extractCandidateNameOrThrow(node: Node): string {
    const candidateName = this.extractCandidateName(node);
    if (!candidateName) {
      throw new Error('Could not extract variable name from node');
    }
    return candidateName;
  }

  static extractCandidateName(node: Node): string | null {
    return this.trySimpleTextExtraction(node) ||
           this.tryVariableDeclarationExtraction(node) ||
           this.tryIdentifierDescendantExtraction(node);
  }

  static trySimpleTextExtraction(node: Node): string | null {
    const text = node.getText().trim();
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(text) ? text : null;
  }

  static tryVariableDeclarationExtraction(node: Node): string | null {
    if (node.getKind() === ts.SyntaxKind.VariableDeclaration) {
      const symbol = node.getSymbol();
      const declarations = symbol?.getDeclarations();
      const variableDeclaration = declarations?.[0];
      return variableDeclaration ? variableDeclaration.getText() : null;
    }
    return null;
  }

  static tryIdentifierDescendantExtraction(node: Node): string | null {
    const identifiers = node.getDescendantsOfKind(ts.SyntaxKind.Identifier);
    return identifiers.length > 0 ? identifiers[0].getText() : null;
  }
}