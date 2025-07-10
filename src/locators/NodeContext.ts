import * as ts from 'typescript';
import { Node, SourceFile } from 'ts-morph';
import { ScopeAnalyzer } from './ScopeAnalyzer';
import { DeclarationFinder } from './DeclarationFinder';
import { VariableNameOperations } from './VariableNameOperations';
import { isShadowingDeclaration } from './ShadowingAnalyzer';

export class NodeContext {
  private readonly node: Node;

  constructor(node: Node) {
    this.node = node;
  }

  getWrappedNode(): Node {
    return this.node;
  }

  getSourceFile(): SourceFile {
    return this.node.getSourceFile();
  }

  getParent(): Node | undefined {
    return this.node.getParent();
  }

  getKind(): ts.SyntaxKind {
    return this.node.getKind();
  }

  getText(): string {
    return this.node.getText();
  }

  getStart(): number {
    return this.node.getStart();
  }

  getFirstDescendantByKind(kind: ts.SyntaxKind): Node | undefined {
    return this.node.getFirstDescendantByKind(kind);
  }

  getPosition(): { line: number; column: number } {
    const sourceFile = this.getSourceFile();
    const start = this.getStart();
    const lineAndColumn = sourceFile.getLineAndColumnAtPos(start);
    return { line: lineAndColumn.line, column: lineAndColumn.column };
  }


  getScope(): NodeContext {
    const scope = ScopeAnalyzer.getNodeScope(this.node);
    return new NodeContext(scope);
  }

  getParentScope(): NodeContext | undefined {
    const scope = this.getScope();
    const parentScope = ScopeAnalyzer.getParentScope(scope.getWrappedNode());
    return parentScope ? new NodeContext(parentScope) : undefined;
  }

  isScopeNode(node?: Node): boolean {
    const targetNode = node || this.node;
    return ScopeAnalyzer.isScopeNode(targetNode);
  }

  isScopeContainedIn(outerScope: NodeContext): boolean {
    let current: Node | undefined = this.node;
    while (current) {
      if (current === outerScope.getWrappedNode()) {
        return true;
      }
      current = current.getParent();
    }
    return false;
  }

  findContainingDeclaration(): NodeContext | undefined {
    let current: Node | undefined = this.node;
    while (current) {
      if (DeclarationFinder.isDeclaration(current)) {
        return new NodeContext(current);
      }
      current = current.getParent();
    }
    return undefined;
  }

  getVariableName(): string | undefined {
    return VariableNameOperations.getVariableName(this.node);
  }

  getVariableNameRequired(): string {
    return VariableNameOperations.getVariableNameRequired(this.node);
  }

  getDeclarationIdentifier(): Node | undefined {
    return VariableNameOperations.getDeclarationIdentifier(this.node);
  }

  isUsageNode(variableName: string, declarationIdentifier: Node | undefined): boolean {
    return VariableNameOperations.isUsageNode(this.node, variableName, declarationIdentifier);
  }

  matchesVariableName(variableName: string): boolean {
    return VariableNameOperations.matchesVariableName(this.node, variableName);
  }

  equals(other: NodeContext): boolean {
    return this.node === other.getWrappedNode();
  }

  static getNodeScope(node: Node): Node {
    return ScopeAnalyzer.getNodeScope(node);
  }

  static getParentScope(scope: Node): Node | undefined {
    return ScopeAnalyzer.getParentScope(scope);
  }

  static isScopeContainedIn(innerScope: Node, outerScope: Node): boolean {
    return ScopeAnalyzer.isScopeContainedIn(innerScope, outerScope);
  }

  isShadowingDeclaration(variableName: string, targetNode: Node, usageScope: Node): boolean {
    return isShadowingDeclaration({
      node: this.node,
      variableName,
      targetNode,
      usageScope
    });
  }

  isAnyDeclaration(): boolean {
    return DeclarationFinder.isAnyDeclaration(this.node);
  }

  static findContainingDeclaration(node: Node): NodeContext | undefined {
    return DeclarationFinder.findContainingDeclaration(node);
  }

  static getScope(node: Node): NodeContext {
    const nodeContext = new NodeContext(node);
    return nodeContext.getScope();
  }

  static getParentScopeContext(node: Node): NodeContext | undefined {
    const nodeContext = new NodeContext(node);
    return nodeContext.getParentScope();
  }
}