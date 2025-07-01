import { Node } from 'ts-morph';

export class VariableNameValidator {
  generateUniqueName(baseName: string, scope: Node): string {
    const existingNames = this.getExistingVariableNames(scope);
    
    if (!existingNames.has(baseName)) {
      return baseName;
    }

    throw new Error(`Variable name '${baseName}' already exists in this scope. Please choose a different name.`);
  }

  getExistingVariableNames(scope: Node): Set<string> {
    const names = new Set<string>();
    
    scope.forEachDescendant((node) => {
      this.addVariableNameIfExists(node, names);
      this.addParameterNameIfExists(node, names);
    });
    
    return names;
  }

  private addVariableNameIfExists(node: Node, names: Set<string>): void {
    if (Node.isVariableDeclaration(node)) {
      const nameNode = node.getNameNode();
      if (Node.isIdentifier(nameNode)) {
        names.add(nameNode.getText());
      }
    }
  }

  private addParameterNameIfExists(node: Node, names: Set<string>): void {
    if (Node.isParameterDeclaration(node)) {
      const nameNode = node.getNameNode();
      if (Node.isIdentifier(nameNode)) {
        names.add(nameNode.getText());
      }
    }
  }
}