import * as ts from 'typescript';
import { Node, SourceFile } from 'ts-morph';

export interface PositionRequest {
  line: number;
  column: number;
  position: number;
}

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

  static calculatePosition(sourceFile: SourceFile, line: number, column: number): number {
    return sourceFile.compilerNode.getPositionOfLineAndCharacter(line - 1, column - 1);
  }

  static getNodeAtPosition(sourceFile: SourceFile, request: PositionRequest): NodeContext {
    const node = sourceFile.getDescendantAtPos(request.position);
    if (!node) {
      throw new Error(NodeContext.createPositionErrorMessage(request));
    }
    return new NodeContext(node);
  }

  private static createPositionErrorMessage(request: PositionRequest): string {
    return `No node found at line ${request.line}, column ${request.column}`;
  }

  getScope(): NodeContext {
    let current = this.getParent();
    while (current) {
      if (this.isScopeNode(current)) {
        return new NodeContext(current);
      }
      current = current.getParent();
    }
    return new NodeContext(this.getSourceFile());
  }

  getParentScope(): NodeContext | undefined {
    let current = this.getParent();
    while (current) {
      if (this.isScopeNode(current)) {
        return new NodeContext(current);
      }
      current = current.getParent();
    }
    return undefined;
  }

  isScopeNode(node?: Node): boolean {
    const targetNode = node || this.node;
    return targetNode.getKind() === ts.SyntaxKind.FunctionDeclaration ||
           targetNode.getKind() === ts.SyntaxKind.FunctionExpression ||
           targetNode.getKind() === ts.SyntaxKind.ArrowFunction ||
           targetNode.getKind() === ts.SyntaxKind.Block ||
           targetNode.getKind() === ts.SyntaxKind.SourceFile;
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
      if (this.isDeclaration(current)) {
        return new NodeContext(current);
      }
      current = current.getParent();
    }
    return undefined;
  }

  private isDeclaration(node: Node): boolean {
    return node.getKind() === ts.SyntaxKind.VariableDeclaration ||
           node.getKind() === ts.SyntaxKind.Parameter;
  }

  getVariableName(): string | undefined {
    const identifier = this.node.getFirstDescendantByKind(ts.SyntaxKind.Identifier);
    return identifier?.getText();
  }

  getVariableNameRequired(): string {
    const identifier = this.node.getFirstDescendantByKind(ts.SyntaxKind.Identifier);
    if (!identifier) {
      throw new Error('Declaration node does not contain an identifier');
    }
    return identifier.getText();
  }

  getDeclarationIdentifier(): Node | undefined {
    return this.node.getFirstDescendantByKind(ts.SyntaxKind.Identifier);
  }

  isUsageNode(variableName: string, declarationIdentifier: Node | undefined): boolean {
    return this.node.getKind() === ts.SyntaxKind.Identifier && 
           this.node.getText() === variableName && 
           this.node !== declarationIdentifier;
  }

  matchesVariableName(variableName: string): boolean {
    const identifier = this.node.getFirstDescendantByKind(ts.SyntaxKind.Identifier);
    return identifier?.getText() === variableName;
  }

  equals(other: NodeContext): boolean {
    return this.node === other.getWrappedNode();
  }

  static getNodeScope(node: Node): Node {
    return NodeContext.findNodeScope(node);
  }

  static getParentScope(scope: Node): Node | undefined {
    return NodeContext.findParentScope(scope);
  }

  private static findNodeScope(node: Node): Node {
    let current = node.getParent();
    while (current) {
      if (NodeContext.isScopeNodeStatic(current)) {
        return current;
      }
      current = current.getParent();
    }
    return node.getSourceFile();
  }

  private static findParentScope(scope: Node): Node | undefined {
    let current = scope.getParent();
    while (current) {
      if (NodeContext.isScopeNodeStatic(current)) {
        return current;
      }
      current = current.getParent();
    }
    return undefined;
  }

  private static isScopeNodeStatic(node: Node): boolean {
    return node.getKind() === ts.SyntaxKind.FunctionDeclaration ||
           node.getKind() === ts.SyntaxKind.FunctionExpression ||
           node.getKind() === ts.SyntaxKind.ArrowFunction ||
           node.getKind() === ts.SyntaxKind.Block ||
           node.getKind() === ts.SyntaxKind.SourceFile;
  }

  static isScopeContainedIn(innerScope: Node, outerScope: Node): boolean {
    const innerContext = new NodeContext(innerScope);
    const outerContext = new NodeContext(outerScope);
    return innerContext.isScopeContainedIn(outerContext);
  }

  isShadowingDeclaration(variableName: string, targetNode: Node, usageScope: Node): boolean {
    return this.isAnyDeclaration() && 
           this.matchesVariableName(variableName) &&
           this.node !== targetNode &&
           NodeContext.getNodeScope(this.node) === usageScope;
  }

  isAnyDeclaration(): boolean {
    return this.node.getKind() === ts.SyntaxKind.VariableDeclaration ||
           this.node.getKind() === ts.SyntaxKind.Parameter;
  }

  static findContainingDeclaration(node: Node): NodeContext | undefined {
    const nodeContext = new NodeContext(node);
    return nodeContext.findContainingDeclaration();
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