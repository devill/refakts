import { Node, VariableDeclaration } from 'ts-morph';
import { ContextAnalyzer } from '../services/context-analyzer';
import { VariableReferenceRequest } from '../../services/variable-reference-request';

export class VariableReplacer {
  private contextAnalyzer = new ContextAnalyzer();

  replaceAllReferences(variableName: string, declaration: VariableDeclaration, initializerText: string): void {
    const references = this.findAllReferences(variableName, declaration);
    for (const reference of references) {
      reference.replaceWithText(initializerText);
    }
  }

  removeDeclaration(declaration: VariableDeclaration): void {
    const declarationStatement = declaration.getVariableStatement();
    if (declarationStatement) {
      declarationStatement.remove();
    }
  }

  private findAllReferences(variableName: string, declaration: VariableDeclaration): Node[] {
    const declarationNode = declaration.getNameNode();
    const declarationScope = this.findDeclarationScope(declaration);
    const request = new VariableReferenceRequest(declarationScope, variableName, declarationNode);
    this.collectScopedReferences(request);
    return request.getReferences();
  }

  private findDeclarationScope(declaration: VariableDeclaration): Node {
    let current: Node | undefined = declaration;
    while (current) {
      if (Node.isBlock(current) || Node.isMethodDeclaration(current) || Node.isFunctionDeclaration(current) || Node.isSourceFile(current)) {
        return current;
      }
      current = current.getParent();
    }
    return declaration.getSourceFile();
  }

  private collectScopedReferences(request: VariableReferenceRequest): void {
    request.scope.forEachDescendant((node: Node) => {
      if (this.isMatchingIdentifier(node, request)) {
        request.addReference(node);
      }
    });
  }


  private isMatchingIdentifier(node: Node, request: VariableReferenceRequest): boolean {
    return request.isMatchingReference(node) &&
           this.contextAnalyzer.isValidReferenceContext(node);
  }
}