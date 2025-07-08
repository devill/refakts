import { Node } from 'ts-morph';
import { NodeContext } from './NodeContext';

export class NodeTraversalHelper {
  

  static findContainingDeclaration(node: Node): Node | undefined {
    const nodeContext = new NodeContext(node);
    const containingDeclaration = nodeContext.findContainingDeclaration();
    return containingDeclaration?.getWrappedNode();
  }


  static getVariableName(declaration: Node): string | undefined {
    const nodeContext = new NodeContext(declaration);
    return nodeContext.getVariableName();
  }


  static getVariableNameRequired(declaration: Node): string {
    const nodeContext = new NodeContext(declaration);
    return nodeContext.getVariableNameRequired();
  }


  static getDeclarationIdentifier(declaration: Node): Node | undefined {
    const nodeContext = new NodeContext(declaration);
    return nodeContext.getDeclarationIdentifier();
  }


  static isUsageNode(node: Node, variableName: string, declarationIdentifier: Node | undefined): boolean {
    const nodeContext = new NodeContext(node);
    return nodeContext.isUsageNode(variableName, declarationIdentifier);
  }
}