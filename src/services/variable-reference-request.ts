import { Node } from 'ts-morph';

/**
 * Encapsulates all parameters needed for variable reference operations.
 * This eliminates the need to pass multiple parameters to each method.
 */
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

  /**
   * Adds a reference node to the collection.
   */
  addReference(node: Node): void {
    this.references.push(node);
  }

  /**
   * Gets all collected references.
   */
  getReferences(): Node[] {
    return [...this.references];
  }

  /**
   * Checks if a node matches the variable name and is not the declaration.
   */
  isMatchingReference(node: Node): boolean {
    return node.getKind() === 80 && // SyntaxKind.Identifier
           node.getText() === this.variableName && 
           node !== this.declarationNode;
  }
}