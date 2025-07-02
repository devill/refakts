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
    
    this.addFunctionParametersIfInBlock(scope, names);
    this.addDescendantVariableNames(scope, names);
    
    return names;
  }

  private addFunctionParametersIfInBlock(scope: Node, names: Set<string>): void {
    if (Node.isBlock(scope)) {
      const parent = scope.getParent();
      if (this.isFunctionNode(parent)) {
        this.addFunctionParameterNames(parent, names);
      }
    }
  }

  private isFunctionNode(node: Node): boolean {
    return Node.isFunctionDeclaration(node) || Node.isFunctionExpression(node) || 
           Node.isArrowFunction(node) || Node.isMethodDeclaration(node) || 
           Node.isConstructorDeclaration(node);
  }

  private addDescendantVariableNames(scope: Node, names: Set<string>): void {
    scope.forEachDescendant((node) => {
      this.addVariableNameIfExists(node, names);
      this.addParameterNameIfExists(node, names);
    });
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
    if (this.isFunctionNode(functionNode)) {
      this.processParameters(functionNode, names);
    }
  }

  private processParameters(functionNode: Node, names: Set<string>): void {
    const parameters = (functionNode as any).getParameters();
    for (const param of parameters) {
      this.processParameter(param, names);
    }
  }

  private processParameter(param: any, names: Set<string>): void {
    const nameNode = param.getNameNode();
    if (Node.isIdentifier(nameNode)) {
      names.add(nameNode.getText());
    } else {
      this.addDestructuredParameterNames(nameNode, names);
    }
  }

  private addDestructuredParameterNames(nameNode: Node, names: Set<string>): void {
    if (Node.isObjectBindingPattern(nameNode)) {
      this.addObjectBindingNames(nameNode, names);
    } else if (Node.isArrayBindingPattern(nameNode)) {
      this.addArrayBindingNames(nameNode, names);
    }
  }

  private addObjectBindingNames(nameNode: Node, names: Set<string>): void {
    if (Node.isObjectBindingPattern(nameNode)) {
      nameNode.getElements().forEach((element: any) => {
        const elementName = element.getNameNode();
        if (Node.isIdentifier(elementName)) {
          names.add(elementName.getText());
        }
      });
    }
  }

  private addArrayBindingNames(nameNode: Node, names: Set<string>): void {
    if (Node.isArrayBindingPattern(nameNode)) {
      nameNode.getElements().forEach((element: any) => {
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