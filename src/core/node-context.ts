import * as ts from 'typescript';
import { Node, SourceFile } from 'ts-morph';
import { PositionData } from './position-data';
import { NodeDeclarationMatcher } from '../locators/services/node-declaration-matcher';
import { NodeAssignmentAnalyzer } from '../locators/services/node-assignment-analyzer';
import { NodeScopeAnalyzer } from '../locators/services/node-scope-analyzer';
import { VariableNameExtractor } from '../locators/services/variable-name-extractor';

export class NodeContext {
  readonly node: Node;
  readonly sourceFile: SourceFile;
  readonly position: PositionData;

  constructor(node: Node, sourceFile: SourceFile, position: PositionData) {
    this.node = node;
    this.sourceFile = sourceFile;
    this.position = position;
  }

  static create(node: Node, sourceFile: SourceFile): NodeContext {
    const position = PositionData.fromNodePosition(sourceFile, node.getStart());
    return new NodeContext(node, sourceFile, position);
  }

  getContainingDeclaration(): Node | undefined {
    return NodeDeclarationMatcher.findContainingDeclaration(this.node);
  }

  getUsageType(): 'read' | 'write' | 'update' {
    return NodeAssignmentAnalyzer.determineUsageType(this.node);
  }

  getScope(): Node {
    return NodeScopeAnalyzer.getNodeScope(this.node);
  }

  getVariableName(): string | undefined {
    return VariableNameExtractor.getVariableName(this.node);
  }

  getVariableNameRequired(): string {
    return VariableNameExtractor.getVariableNameRequired(this.node);
  }

  isIdentifier(): boolean {
    return this.node.getKind() === ts.SyntaxKind.Identifier;
  }

  isDeclaration(): boolean {
    return NodeDeclarationMatcher.findContainingDeclaration(this.node) === this.node;
  }

  matchesVariableName(variableName: string): boolean {
    return NodeDeclarationMatcher.hasMatchingIdentifier(this.node, variableName);
  }

  needsParentheses(): boolean {
    return NodeDeclarationMatcher.needsParentheses(this.node);
  }

  isUsageNode(variableName: string, declarationIdentifier: Node | undefined): boolean {
    return NodeDeclarationMatcher.isUsageNode(this.node, variableName, declarationIdentifier);
  }

  isInValidExtractionScope(): boolean {
    const parent = this.node.getParent();
    return NodeDeclarationMatcher.isValidExtractionScope(parent);
  }

  isContainingStatement(): boolean {
    return NodeDeclarationMatcher.isContainingStatement(this.node);
  }

  withNode(node: Node): NodeContext {
    return new NodeContext(node, this.sourceFile, this.position);
  }

  isVariableDeclaration(variableName: string): boolean {
    return this.node.getKind() === ts.SyntaxKind.VariableDeclaration &&
           this.matchesVariableName(variableName);
  }

  isParameterDeclaration(variableName: string): boolean {
    return this.node.getKind() === ts.SyntaxKind.Parameter &&
           this.matchesVariableName(variableName);
  }

  isMatchingDeclaration(variableName: string): boolean {
    return this.isVariableDeclaration(variableName) || 
           this.isParameterDeclaration(variableName);
  }

  isAssignmentContext(): boolean {
    const parent = this.node.getParent();
    if (!parent) return false;
    
    return this.isBinaryAssignment(parent);
  }

  isUpdateContext(): boolean {
    const parent = this.node.getParent();
    if (!parent) return false;
    
    return this.isUnaryUpdateExpression(parent) || 
           this.isCompoundAssignment(parent);
  }

  private isBinaryAssignment(parent: Node): boolean {
    if (parent.getKind() !== ts.SyntaxKind.BinaryExpression) return false;
    
    const binaryExpr = parent.asKindOrThrow(ts.SyntaxKind.BinaryExpression);
    return this.isAssignmentOperator(binaryExpr) && binaryExpr.getLeft() === this.node;
  }

  private isAssignmentOperator(binaryExpr: Node): boolean {
    const binExpr = binaryExpr.asKindOrThrow(ts.SyntaxKind.BinaryExpression);
    return binExpr.getOperatorToken().getKind() === ts.SyntaxKind.EqualsToken;
  }

  private isUnaryUpdateExpression(parent: Node): boolean {
    return parent.getKind() === ts.SyntaxKind.PostfixUnaryExpression ||
           parent.getKind() === ts.SyntaxKind.PrefixUnaryExpression;
  }

  private isCompoundAssignment(parent: Node): boolean {
    if (parent.getKind() !== ts.SyntaxKind.BinaryExpression) {
      return false;
    }
    
    const binaryExpr = parent.asKindOrThrow(ts.SyntaxKind.BinaryExpression);
    return this.isCompoundAssignmentOperator(binaryExpr.getOperatorToken().getKind()) &&
           binaryExpr.getLeft() === this.node;
  }

  private isCompoundAssignmentOperator(operator: number): boolean {
    return operator === ts.SyntaxKind.PlusEqualsToken ||
           operator === ts.SyntaxKind.MinusEqualsToken ||
           operator === ts.SyntaxKind.AsteriskEqualsToken ||
           operator === ts.SyntaxKind.SlashEqualsToken;
  }

}