import * as ts from 'typescript';
import { Node, SourceFile, BinaryExpression } from 'ts-morph';

/**
 * Static utility methods for analyzing TypeScript AST nodes.
 * Provides centralized node analysis functionality to reduce feature envy violations.
 */
export class NodeAnalyzer {
  
  // === Node Type Checking Methods ===
  
  /**
   * Checks if a node is a declaration (variable or parameter)
   */
  static isDeclaration(node: Node): boolean {
    return node.getKind() === ts.SyntaxKind.VariableDeclaration ||
           node.getKind() === ts.SyntaxKind.Parameter;
  }

  /**
   * Checks if a node is any kind of declaration (variable, parameter, etc.)
   */
  static isAnyDeclaration(node: Node): boolean {
    return node.getKind() === ts.SyntaxKind.VariableDeclaration ||
           node.getKind() === ts.SyntaxKind.Parameter;
  }

  /**
   * Checks if a node represents a scope boundary
   */
  static isScopeNode(node: Node): boolean {
    return node.getKind() === ts.SyntaxKind.FunctionDeclaration ||
           node.getKind() === ts.SyntaxKind.FunctionExpression ||
           node.getKind() === ts.SyntaxKind.ArrowFunction ||
           node.getKind() === ts.SyntaxKind.Block ||
           node.getKind() === ts.SyntaxKind.SourceFile;
  }

  /**
   * Checks if a node is in an assignment context (write operation)
   */
  static isAssignmentContext(parent: Node | undefined, node: Node): boolean {
    if (!parent) return false;
    
    if (parent.getKind() === ts.SyntaxKind.BinaryExpression) {
      const binaryExpr = parent.asKindOrThrow(ts.SyntaxKind.BinaryExpression);
      return NodeAnalyzer.isAssignmentOperator(binaryExpr) &&
             binaryExpr.getLeft() === node;
    }
    
    return false;
  }

  /**
   * Checks if a node is in an update context (++, --, +=, etc.)
   */
  static isUpdateContext(parent: Node | undefined, node: Node): boolean {
    if (!parent) return false;
    
    return NodeAnalyzer.isUnaryUpdateExpression(parent) || 
           NodeAnalyzer.isCompoundAssignment(parent, node);
  }

  /**
   * Checks if a binary expression is an assignment operator
   */
  static isAssignmentOperator(binaryExpr: BinaryExpression): boolean {
    return binaryExpr.getOperatorToken().getKind() === ts.SyntaxKind.EqualsToken;
  }

  /**
   * Checks if a node is a unary update expression (++, --)
   */
  static isUnaryUpdateExpression(parent: Node): boolean {
    return parent.getKind() === ts.SyntaxKind.PostfixUnaryExpression ||
           parent.getKind() === ts.SyntaxKind.PrefixUnaryExpression;
  }

  /**
   * Checks if a node is a compound assignment (+=, -=, etc.)
   */
  static isCompoundAssignment(parent: Node, node: Node): boolean {
    if (parent.getKind() !== ts.SyntaxKind.BinaryExpression) {
      return false;
    }
    
    const binaryExpr = parent.asKindOrThrow(ts.SyntaxKind.BinaryExpression);
    return NodeAnalyzer.isCompoundAssignmentOperator(binaryExpr.getOperatorToken().getKind()) &&
           binaryExpr.getLeft() === node;
  }

  /**
   * Checks if a syntax kind is a compound assignment operator
   */
  static isCompoundAssignmentOperator(operator: ts.SyntaxKind): boolean {
    return operator === ts.SyntaxKind.PlusEqualsToken ||
           operator === ts.SyntaxKind.MinusEqualsToken ||
           operator === ts.SyntaxKind.AsteriskEqualsToken ||
           operator === ts.SyntaxKind.SlashEqualsToken;
  }

  // === Node Position and Location Methods ===

  /**
   * Calculates the position from line and column numbers
   */
  static calculatePosition(sourceFile: SourceFile, line: number, column: number): number {
    return sourceFile.compilerNode.getPositionOfLineAndCharacter(line - 1, column - 1);
  }

  /**
   * Gets the node at a specific position
   */
  static getNodeAtPosition(sourceFile: SourceFile, position: number, line: number, column: number): Node {
    const node = sourceFile.getDescendantAtPos(position);
    if (!node) {
      throw new Error(`No node found at line ${line}, column ${column}`);
    }
    return node;
  }

  /**
   * Gets the position information for a node
   */
  static getNodePosition(node: Node): { line: number; column: number } {
    const sourceFile = node.getSourceFile();
    const start = node.getStart();
    const lineAndColumn = sourceFile.getLineAndColumnAtPos(start);
    return { line: lineAndColumn.line, column: lineAndColumn.column };
  }

  // === Node Scope Analysis Methods ===

  /**
   * Gets the scope containing a node
   */
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

  /**
   * Gets the parent scope of a given scope
   */
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

  /**
   * Checks if one scope is contained within another
   */
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

  // === Node Traversal and Matching Methods ===

  /**
   * Finds a containing declaration for a node
   */
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

  /**
   * Gets the variable name from a declaration node
   */
  static getVariableName(declaration: Node): string | undefined {
    const identifier = declaration.getFirstDescendantByKind(ts.SyntaxKind.Identifier);
    return identifier?.getText();
  }

  /**
   * Gets the variable name from a declaration node (throws if not found)
   */
  static getVariableNameRequired(declaration: Node): string {
    const identifier = declaration.getFirstDescendantByKind(ts.SyntaxKind.Identifier);
    if (!identifier) {
      throw new Error('Declaration node does not contain an identifier');
    }
    return identifier.getText();
  }

  /**
   * Checks if a node has a matching identifier with the given name
   */
  static hasMatchingIdentifier(node: Node, variableName: string): boolean {
    const identifier = node.getFirstDescendantByKind(ts.SyntaxKind.Identifier);
    return identifier?.getText() === variableName;
  }

  /**
   * Gets the declaration identifier from a declaration node
   */
  static getDeclarationIdentifier(declaration: Node): Node | undefined {
    return declaration.getFirstDescendantByKind(ts.SyntaxKind.Identifier);
  }

  // === Node Validation Methods ===

  /**
   * Checks if a node is a variable declaration with matching name
   */
  static isVariableDeclaration(node: Node, variableName: string): boolean {
    return node.getKind() === ts.SyntaxKind.VariableDeclaration &&
           NodeAnalyzer.hasMatchingIdentifier(node, variableName);
  }

  /**
   * Checks if a node is a parameter declaration with matching name
   */
  static isParameterDeclaration(node: Node, variableName: string): boolean {
    return node.getKind() === ts.SyntaxKind.Parameter &&
           NodeAnalyzer.hasMatchingIdentifier(node, variableName);
  }

  /**
   * Checks if a node is a matching declaration (variable or parameter)
   */
  static isMatchingDeclaration(node: Node, variableName: string): boolean {
    return NodeAnalyzer.isVariableDeclaration(node, variableName) || 
           NodeAnalyzer.isParameterDeclaration(node, variableName);
  }

  /**
   * Checks if a node is a usage node (identifier that matches variable name but is not the declaration)
   */
  static isUsageNode(node: Node, variableName: string, declarationIdentifier: Node | undefined): boolean {
    return node.getKind() === ts.SyntaxKind.Identifier && 
           node.getText() === variableName && 
           node !== declarationIdentifier;
  }

  // === Node Context Analysis Methods ===

  /**
   * Determines the usage type of a node (read, write, update)
   */
  static determineUsageType(node: Node): 'read' | 'write' | 'update' {
    const parent = node.getParent();
    
    if (NodeAnalyzer.isAssignmentContext(parent, node)) return 'write';
    if (NodeAnalyzer.isUpdateContext(parent, node)) return 'update';
    return 'read';
  }

  /**
   * Checks if a node needs parentheses when used in expressions
   */
  static needsParentheses(node: Node): boolean {
    if (!Node.isBinaryExpression(node)) {
      return false;
    }
    
    const binaryExpr = node.asKindOrThrow(ts.SyntaxKind.BinaryExpression);
    const operator = binaryExpr.getOperatorToken().getKind();
    
    if (operator !== ts.SyntaxKind.PlusToken && operator !== ts.SyntaxKind.MinusToken) {
      return false;
    }
    
    const left = binaryExpr.getLeft();
    const right = binaryExpr.getRight();
    return (Node.isIdentifier(left) || Node.isNumericLiteral(left)) &&
           (Node.isIdentifier(right) || Node.isNumericLiteral(right));
  }

  /**
   * Checks if a node is a valid extraction scope (Block or SourceFile)
   */
  static isValidExtractionScope(parent: Node | undefined): parent is Node {
    return parent !== undefined && (Node.isBlock(parent) || Node.isSourceFile(parent));
  }

  /**
   * Checks if a node is a containing statement
   */
  static isContainingStatement(current: Node): boolean {
    const parent = current.getParent();
    return NodeAnalyzer.isValidExtractionScope(parent);
  }
}