import { Node, SourceFile } from 'ts-morph';
import { NodeTypeClassifier } from '../ast/node-type-classifier';
import { 
  NodePositionService, 
  NodePositionParams,
  NodeScopeAnalyzer, 
  NodeAssignmentAnalyzer, 
  VariableNameExtractor, 
  NodeDeclarationMatcher 
} from './locators/index';

export class NodeAnalyzer {

  static calculatePosition(sourceFile: SourceFile, line: number, column: number): number {
    return NodePositionService.calculatePosition(sourceFile, line, column);
  }

  static getNodeAtPosition(sourceFile: SourceFile, params: NodePositionParams): Node {
    return NodePositionService.getNodeAtPosition(sourceFile, params);
  }

  static getNodePosition(node: Node): { line: number; column: number } {
    return NodePositionService.getNodePosition(node);
  }

  static getNodeScope(node: Node): Node {
    return NodeScopeAnalyzer.getNodeScope(node);
  }

  static getParentScope(scope: Node): Node | undefined {
    return NodeScopeAnalyzer.getParentScope(scope);
  }

  static isScopeContainedIn(innerScope: Node, outerScope: Node): boolean {
    return NodeScopeAnalyzer.isScopeContainedIn(innerScope, outerScope);
  }

  static isAssignmentContext(parent: Node | undefined, node: Node): boolean {
    return NodeAssignmentAnalyzer.isAssignmentContext(parent, node);
  }

  static isUpdateContext(parent: Node | undefined, node: Node): boolean {
    return NodeAssignmentAnalyzer.isUpdateContext(parent, node);
  }

  static determineUsageType(node: Node): 'read' | 'write' | 'update' {
    return NodeAssignmentAnalyzer.determineUsageType(node);
  }

  static getVariableName(declaration: Node): string | undefined {
    return VariableNameExtractor.getVariableName(declaration);
  }

  static getVariableNameRequired(declaration: Node): string {
    return VariableNameExtractor.getVariableNameRequired(declaration);
  }

  static getVariableNameFromNode(node: Node): string {
    return VariableNameExtractor.getVariableNameFromNode(node);
  }

  static findContainingDeclaration(node: Node): Node | undefined {
    return NodeDeclarationMatcher.findContainingDeclaration(node);
  }

  static hasMatchingIdentifier(node: Node, variableName: string): boolean {
    return NodeDeclarationMatcher.hasMatchingIdentifier(node, variableName);
  }

  static getDeclarationIdentifier(declaration: Node): Node | undefined {
    return NodeDeclarationMatcher.getDeclarationIdentifier(declaration);
  }

  static isVariableDeclaration(node: Node, variableName: string): boolean {
    return NodeDeclarationMatcher.isVariableDeclaration(node, variableName);
  }

  static isParameterDeclaration(node: Node, variableName: string): boolean {
    return NodeDeclarationMatcher.isParameterDeclaration(node, variableName);
  }

  static isMatchingDeclaration(node: Node, variableName: string): boolean {
    return NodeDeclarationMatcher.isMatchingDeclaration(node, variableName);
  }

  static isUsageNode(node: Node, variableName: string, declarationIdentifier: Node | undefined): boolean {
    return NodeDeclarationMatcher.isUsageNode(node, variableName, declarationIdentifier);
  }

  static needsParentheses(node: Node): boolean {
    return NodeDeclarationMatcher.needsParentheses(node);
  }

  static isValidExtractionScope(parent: Node | undefined): parent is Node {
    return NodeDeclarationMatcher.isValidExtractionScope(parent);
  }

  static isContainingStatement(current: Node): boolean {
    return NodeDeclarationMatcher.isContainingStatement(current);
  }

  static validateIdentifierNode(node: Node): void {
    NodeTypeClassifier.validateIdentifierNode(node);
  }

  static isIdentifierNode(node: Node): boolean {
    return NodeTypeClassifier.isIdentifierNode(node);
  }
}