import * as ts from 'typescript';
import { Node, BinaryExpression } from 'ts-morph';

/**
 * Static utility methods for checking TypeScript node types.
 */
export class NodeTypeChecker {
  
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
      return NodeTypeChecker.isAssignmentOperator(binaryExpr) &&
             binaryExpr.getLeft() === node;
    }
    
    return false;
  }

  /**
   * Checks if a node is in an update context (++, --, +=, etc.)
   */
  static isUpdateContext(parent: Node | undefined, node: Node): boolean {
    if (!parent) return false;
    
    return NodeTypeChecker.isUnaryUpdateExpression(parent) || 
           NodeTypeChecker.isCompoundAssignment(parent, node);
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
    return NodeTypeChecker.isCompoundAssignmentOperator(binaryExpr.getOperatorToken().getKind()) &&
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

  /**
   * Checks if a node is a variable declaration with matching name
   */
  static isVariableDeclaration(node: Node, variableName: string): boolean {
    return node.getKind() === ts.SyntaxKind.VariableDeclaration &&
           NodeTypeChecker.hasMatchingIdentifier(node, variableName);
  }

  /**
   * Checks if a node is a parameter declaration with matching name
   */
  static isParameterDeclaration(node: Node, variableName: string): boolean {
    return node.getKind() === ts.SyntaxKind.Parameter &&
           NodeTypeChecker.hasMatchingIdentifier(node, variableName);
  }

  /**
   * Checks if a node is a matching declaration (variable or parameter)
   */
  static isMatchingDeclaration(node: Node, variableName: string): boolean {
    return NodeTypeChecker.isVariableDeclaration(node, variableName) || 
           NodeTypeChecker.isParameterDeclaration(node, variableName);
  }

  /**
   * Checks if a node has a matching identifier with the given name
   */
  static hasMatchingIdentifier(node: Node, variableName: string): boolean {
    const identifier = node.getFirstDescendantByKind(ts.SyntaxKind.Identifier);
    return identifier?.getText() === variableName;
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
    return NodeTypeChecker.isValidExtractionScope(parent);
  }
}