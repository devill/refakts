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
    
    // If scope is a block, check if its parent is a function and include parameters
    if (Node.isBlock(scope)) {
      const parent = scope.getParent();
      if (Node.isFunctionDeclaration(parent) || Node.isFunctionExpression(parent) || Node.isArrowFunction(parent) || Node.isMethodDeclaration(parent) || Node.isConstructorDeclaration(parent)) {
        this.addFunctionParameterNames(parent, names);
      }
    }
    
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

  private addFunctionParameterNames(functionNode: Node, names: Set<string>): void {
    if (Node.isFunctionDeclaration(functionNode) || Node.isFunctionExpression(functionNode) || Node.isArrowFunction(functionNode) || Node.isMethodDeclaration(functionNode) || Node.isConstructorDeclaration(functionNode)) {
      const parameters = (functionNode as any).getParameters();
      for (const param of parameters) {
        const nameNode = param.getNameNode();
        if (Node.isIdentifier(nameNode)) {
          names.add(nameNode.getText());
        } else {
          // Handle destructuring parameters
          this.addDestructuredParameterNames(nameNode, names);
        }
      }
    }
  }

  private addDestructuredParameterNames(nameNode: Node, names: Set<string>): void {
    if (Node.isObjectBindingPattern(nameNode)) {
      nameNode.getElements().forEach(element => {
        const elementName = element.getNameNode();
        if (Node.isIdentifier(elementName)) {
          names.add(elementName.getText());
        }
      });
    } else if (Node.isArrayBindingPattern(nameNode)) {
      nameNode.getElements().forEach(element => {
        if (element && Node.isBindingElement(element)) {
          const elementName = element.getNameNode();
          if (Node.isIdentifier(elementName)) {
            names.add(elementName.getText());
          }
        }
      });
    }
  }
}