import { Node, VariableDeclaration } from 'ts-morph';
import { ContextAnalyzer } from './context-analyzer';

export class VariableReplacer {
  private contextAnalyzer = new ContextAnalyzer();

  replaceAllReferences(sourceFile: any, variableName: string, declaration: VariableDeclaration, initializerText: string): void {
    const references = this.findAllReferences(sourceFile, variableName, declaration);
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

  private findAllReferences(sourceFile: any, variableName: string, declaration: VariableDeclaration): Node[] {
    const references: Node[] = [];
    const declarationNode = declaration.getNameNode();
    this.collectMatchingIdentifiers(sourceFile, variableName, declarationNode, references);
    return references;
  }

  private collectMatchingIdentifiers(sourceFile: any, variableName: string, declarationNode: Node, references: Node[]): void {
    sourceFile.forEachDescendant((node: Node) => {
      if (this.isMatchingIdentifier(node, variableName, declarationNode)) {
        references.push(node);
      }
    });
  }

  private isMatchingIdentifier(node: Node, variableName: string, declarationNode: Node): boolean {
    return node.getKind() === 80 && 
           node.getText() === variableName && 
           node !== declarationNode &&
           !this.contextAnalyzer.isInTypeContext(node) &&
           !this.contextAnalyzer.isInDestructuringPattern(node);
  }
}