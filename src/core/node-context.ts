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
    return this.node.getKind() === 80; // SyntaxKind.Identifier
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
}