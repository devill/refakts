import * as ts from 'typescript';
import { Node, SourceFile, BinaryExpression } from 'ts-morph';

export class NodeAnalyzer {
  static isDeclaration(node: Node): boolean {
    return node.getKind() === ts.SyntaxKind.VariableDeclaration ||
           node.getKind() === ts.SyntaxKind.Parameter;
  }

  static isAnyDeclaration(node: Node): boolean {
    return node.getKind() === ts.SyntaxKind.VariableDeclaration ||
           node.getKind() === ts.SyntaxKind.Parameter;
  }

  static isScopeNode(node: Node): boolean {
    return node.getKind() === ts.SyntaxKind.FunctionDeclaration ||
           node.getKind() === ts.SyntaxKind.FunctionExpression ||
           node.getKind() === ts.SyntaxKind.ArrowFunction ||
           node.getKind() === ts.SyntaxKind.Block ||
           node.getKind() === ts.SyntaxKind.SourceFile;
  }

  static isAssignmentContext(parent: Node | undefined, node: Node): boolean {
    if (!parent) return false;
    
    return this.isBinaryAssignment(parent, node);
  }

  private static isBinaryAssignment(parent: Node, node: Node): boolean {
    if (parent.getKind() !== ts.SyntaxKind.BinaryExpression) return false;
    
    const binaryExpr = parent.asKindOrThrow(ts.SyntaxKind.BinaryExpression);
    return NodeAnalyzer.isAssignmentOperator(binaryExpr) && binaryExpr.getLeft() === node;
  }

  static isUpdateContext(parent: Node | undefined, node: Node): boolean {
    if (!parent) return false;
    
    return NodeAnalyzer.isUnaryUpdateExpression(parent) || 
           NodeAnalyzer.isCompoundAssignment(parent, node);
  }

  static isAssignmentOperator(binaryExpr: BinaryExpression): boolean {
    return binaryExpr.getOperatorToken().getKind() === ts.SyntaxKind.EqualsToken;
  }

  static isUnaryUpdateExpression(parent: Node): boolean {
    return parent.getKind() === ts.SyntaxKind.PostfixUnaryExpression ||
           parent.getKind() === ts.SyntaxKind.PrefixUnaryExpression;
  }

  static isCompoundAssignment(parent: Node, node: Node): boolean {
    if (parent.getKind() !== ts.SyntaxKind.BinaryExpression) {
      return false;
    }
    
    const binaryExpr = parent.asKindOrThrow(ts.SyntaxKind.BinaryExpression);
    return NodeAnalyzer.isCompoundAssignmentOperator(binaryExpr.getOperatorToken().getKind()) &&
           binaryExpr.getLeft() === node;
  }

  static isCompoundAssignmentOperator(operator: ts.SyntaxKind): boolean {
    return operator === ts.SyntaxKind.PlusEqualsToken ||
           operator === ts.SyntaxKind.MinusEqualsToken ||
           operator === ts.SyntaxKind.AsteriskEqualsToken ||
           operator === ts.SyntaxKind.SlashEqualsToken;
  }


  static calculatePosition(sourceFile: SourceFile, line: number, column: number): number {
    return sourceFile.compilerNode.getPositionOfLineAndCharacter(line - 1, column - 1);
  }

  static getNodeAtPosition(sourceFile: SourceFile, position: number, line: number, column: number): Node {
    const node = sourceFile.getDescendantAtPos(position);
    if (!node) {
      throw new Error(`No node found at line ${line}, column ${column}`);
    }
    return node;
  }

  static getNodePosition(node: Node): { line: number; column: number } {
    const sourceFile = node.getSourceFile();
    const start = node.getStart();
    const lineAndColumn = sourceFile.getLineAndColumnAtPos(start);
    return { line: lineAndColumn.line, column: lineAndColumn.column };
  }


  static getNodeScope(node: Node): Node {
    let current = node.getParent();
    while (current) {
      if (NodeAnalyzer.isScopeNode(current)) {
        return current;
      }
      current = current.getParent();
    }
    return node.getSourceFile();
  }

  static getParentScope(scope: Node): Node | undefined {
    let current = scope.getParent();
    while (current) {
      if (NodeAnalyzer.isScopeNode(current)) {
        return current;
      }
      current = current.getParent();
    }
    return undefined;
  }

  static isScopeContainedIn(innerScope: Node, outerScope: Node): boolean {
    let current: Node | undefined = innerScope;
    while (current) {
      if (current === outerScope) {
        return true;
      }
      current = current.getParent();
    }
    return false;
  }


  static findContainingDeclaration(node: Node): Node | undefined {
    let current: Node | undefined = node;
    while (current) {
      if (NodeAnalyzer.isDeclaration(current)) {
        return current;
      }
      current = current.getParent();
    }
    return undefined;
  }

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

  static hasMatchingIdentifier(node: Node, variableName: string): boolean {
    const identifier = node.getFirstDescendantByKind(ts.SyntaxKind.Identifier);
    return identifier?.getText() === variableName;
  }

  static getDeclarationIdentifier(declaration: Node): Node | undefined {
    return declaration.getFirstDescendantByKind(ts.SyntaxKind.Identifier);
  }


  static validateIdentifierNode(node: Node): void {
    if (node.getKind() !== ts.SyntaxKind.Identifier) {
      throw new Error(`Expected identifier, got ${node.getKindName()}`);
    }
  }

  static isIdentifierNode(node: Node): boolean {
    return node.getKind() === ts.SyntaxKind.Identifier;
  }

  static getVariableNameFromNode(node: Node): string {
    return NodeAnalyzer.isIdentifierNode(node) 
      ? node.getText() 
      : NodeAnalyzer.extractCandidateNameOrThrow(node);
  }

  static extractCandidateNameOrThrow(node: Node): string {
    const candidateName = NodeAnalyzer.extractCandidateName(node);
    if (!candidateName) {
      throw new Error('Could not extract variable name from node');
    }
    return candidateName;
  }

  static extractCandidateName(node: Node): string | null {
    return NodeAnalyzer.trySimpleTextExtraction(node) ||
           NodeAnalyzer.tryVariableDeclarationExtraction(node) ||
           NodeAnalyzer.tryIdentifierDescendantExtraction(node);
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

  static isVariableDeclaration(node: Node, variableName: string): boolean {
    return node.getKind() === ts.SyntaxKind.VariableDeclaration &&
           NodeAnalyzer.hasMatchingIdentifier(node, variableName);
  }

  static isParameterDeclaration(node: Node, variableName: string): boolean {
    return node.getKind() === ts.SyntaxKind.Parameter &&
           NodeAnalyzer.hasMatchingIdentifier(node, variableName);
  }

  static isMatchingDeclaration(node: Node, variableName: string): boolean {
    return NodeAnalyzer.isVariableDeclaration(node, variableName) || 
           NodeAnalyzer.isParameterDeclaration(node, variableName);
  }

  static isUsageNode(node: Node, variableName: string, declarationIdentifier: Node | undefined): boolean {
    return node.getKind() === ts.SyntaxKind.Identifier && 
           node.getText() === variableName && 
           node !== declarationIdentifier;
  }


  static determineUsageType(node: Node): 'read' | 'write' | 'update' {
    const parent = node.getParent();
    
    if (NodeAnalyzer.isAssignmentContext(parent, node)) return 'write';
    if (NodeAnalyzer.isUpdateContext(parent, node)) return 'update';
    return 'read';
  }

  static needsParentheses(node: Node): boolean {
    if (!Node.isBinaryExpression(node)) return false;
    
    const binaryExpr = node.asKindOrThrow(ts.SyntaxKind.BinaryExpression);
    return this.isArithmeticExpression(binaryExpr) && this.hasSimpleOperands(binaryExpr);
  }

  private static isArithmeticExpression(binaryExpr: BinaryExpression): boolean {
    const operator = binaryExpr.getOperatorToken().getKind();
    return operator === ts.SyntaxKind.PlusToken || operator === ts.SyntaxKind.MinusToken;
  }

  private static hasSimpleOperands(binaryExpr: BinaryExpression): boolean {
    const left = binaryExpr.getLeft();
    const right = binaryExpr.getRight();
    return (Node.isIdentifier(left) || Node.isNumericLiteral(left)) &&
           (Node.isIdentifier(right) || Node.isNumericLiteral(right));
  }

  static isValidExtractionScope(parent: Node | undefined): parent is Node {
    return parent !== undefined && (Node.isBlock(parent) || Node.isSourceFile(parent));
  }

  static isContainingStatement(current: Node): boolean {
    const parent = current.getParent();
    return NodeAnalyzer.isValidExtractionScope(parent);
  }
}