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
      throw new Error(`No node found at line ${request.line}, column ${request.column}`);
    }
    return new NodeContext(node);
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

  equals(other: NodeContext): boolean {
    return this.node === other.getWrappedNode();
  }
}