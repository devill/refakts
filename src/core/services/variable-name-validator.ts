import { Node, ParameterDeclaration, FunctionDeclaration, MethodDeclaration, ArrowFunction, FunctionExpression, BindingElement, OmittedExpression, ConstructorDeclaration, ObjectBindingPattern } from 'ts-morph';
import { ScopeAnalyzer } from './scope-analyzer';

type FunctionLikeNode = FunctionDeclaration | MethodDeclaration | ArrowFunction | FunctionExpression | ConstructorDeclaration;

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
    this.addParentScopeVariableNames(scope, names);
    
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

  private addParentScopeVariableNames(scope: Node, names: Set<string>): void {
    let parentScope = ScopeAnalyzer.getParentScope(scope);
    while (parentScope) {
      this.addDirectVariableNames(parentScope, names);
      this.addFunctionParametersIfInBlock(parentScope, names);
      parentScope = ScopeAnalyzer.getParentScope(parentScope);
    }
  }

  private addDirectVariableNames(scope: Node, names: Set<string>): void {
    scope.forEachChild((child) => {
      this.addChildVariableNames(child, names);
    });
  }

  private addChildVariableNames(child: Node, names: Set<string>): void {
    if (Node.isVariableStatement(child)) {
      child.getDeclarations().forEach((declaration) => {
        this.addVariableNameIfExists(declaration, names);
      });
    } else if (Node.isVariableDeclaration(child)) {
      this.addVariableNameIfExists(child, names);
    } else if (Node.isParameterDeclaration(child)) {
      this.addParameterNameIfExists(child, names);
    }
  }

  private addNameIfIdentifier(node: Node, names: Set<string>): void {
    if (Node.isIdentifier(node)) {
      names.add(node.getText());
    }
  }

  private addVariableNameIfExists(node: Node, names: Set<string>): void {
    if (Node.isVariableDeclaration(node)) {
      this.addNameIfIdentifier(node.getNameNode(), names);
    }
  }

  private addParameterNameIfExists(node: Node, names: Set<string>): void {
    if (Node.isParameterDeclaration(node)) {
      this.addNameIfIdentifier(node.getNameNode(), names);
    }
  }

  private addFunctionParameterNames(functionNode: Node, names: Set<string>): void {
    if (this.isFunctionNode(functionNode)) {
      this.processParameters(functionNode, names);
    }
  }

  private processParameters(functionNode: Node, names: Set<string>): void {
    const parameters = this.getParametersFromFunction(functionNode);
    for (const param of parameters) {
      this.processParameter(param, names);
    }
  }

  private getParametersFromFunction(functionNode: Node): ParameterDeclaration[] {
    if (this.isFunctionNode(functionNode)) {
      return (functionNode as FunctionLikeNode).getParameters();
    }
    return [];
  }

  private processParameter(param: ParameterDeclaration, names: Set<string>): void {
    const nameNode = param.getNameNode();
    if (Node.isIdentifier(nameNode)) {
      this.addNameIfIdentifier(nameNode, names);
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
      this.processBindingElements(nameNode, names);
    }
  }

  private processBindingElements(nameNode: ObjectBindingPattern, names: Set<string>): void {
    nameNode.getElements().forEach((element: BindingElement | OmittedExpression) => {
      this.processBindingElement(element, names);
    });
  }

  private processBindingElement(element: BindingElement | OmittedExpression, names: Set<string>): void {
    if (!Node.isBindingElement(element)) return;
    this.addNameIfIdentifier(element.getNameNode(), names);
  }

  private addArrayBindingNames(nameNode: Node, names: Set<string>): void {
    if (Node.isArrayBindingPattern(nameNode)) {
      nameNode.getElements().forEach((element: BindingElement | OmittedExpression) => {
        this.processArrayBindingElement(element, names);
      });
    }
  }

  private processArrayBindingElement(element: BindingElement | OmittedExpression, names: Set<string>): void {
    if (element && Node.isBindingElement(element)) {
      this.addNameIfIdentifier(element.getNameNode(), names);
    }
  }
}