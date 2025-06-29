import { Node } from 'ts-morph';

export class VariableScope {
  findReferencesInSameScope(declarationNode: Node, variableName: string): Node[] {
    const sourceFile = declarationNode.getSourceFile();
    const references: Node[] = [];
    
    sourceFile.forEachDescendant((node: Node) => {
      if (this.isMatchingReference(node, variableName, declarationNode)) {
        references.push(node);
      }
    });
    
    return references;
  }

  private isMatchingReference(node: Node, variableName: string, declarationNode: Node): boolean {
    return node.getKind() === 80 && 
           node.getText() === variableName && 
           node !== declarationNode;
  }
}