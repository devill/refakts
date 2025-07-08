import { Node } from 'ts-morph';
import { NodeContext } from '../core/node-context';

export class VariableReferenceRequest {
  public readonly scope: Node;
  public readonly variableName: string;
  public readonly declarationNode: Node;
  public readonly references: Node[];
  private readonly declarationContext: NodeContext;

  constructor(scope: Node, variableName: string, declarationNode: Node) {
    this.scope = scope;
    this.variableName = variableName;
    this.declarationNode = declarationNode;
    this.references = [];
    this.declarationContext = NodeContext.create(declarationNode, declarationNode.getSourceFile());
  }

  addReference(node: Node): void {
    this.references.push(node);
  }

  getReferences(): Node[] {
    return [...this.references];
  }

  isMatchingReference(node: Node): boolean {
    const nodeContext = NodeContext.create(node, node.getSourceFile());
    return nodeContext.isIdentifier() && 
           node.getText() === this.variableName && 
           node !== this.declarationNode;
  }
}