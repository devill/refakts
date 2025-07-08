import { Node } from 'ts-morph';

export class VariableReferenceRequest {
  public readonly scope: Node;
  public readonly variableName: string;
  public readonly declarationNode: Node;
  public readonly references: Node[];

  constructor(scope: Node, variableName: string, declarationNode: Node) {
    this.scope = scope;
    this.variableName = variableName;
    this.declarationNode = declarationNode;
    this.references = [];
  }


  addReference(node: Node): void {
    this.references.push(node);
  }


  getReferences(): Node[] {
    return [...this.references];
  }


  isMatchingReference(node: Node): boolean {
    return node.getKind() === 80 && // SyntaxKind.Identifier
           node.getText() === this.variableName && 
           node !== this.declarationNode;
  }
}