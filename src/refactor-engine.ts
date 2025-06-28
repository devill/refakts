import { Project, Node, VariableDeclaration, SyntaxKind } from 'ts-morph';
import { tsquery } from '@phenomnomnominal/tsquery';
import * as path from 'path';

export class RefactorEngine {
  private project: Project;

  constructor() {
    this.project = new Project();
  }


  async inlineVariableByQuery(filePath: string, query: string): Promise<void> {
    const sourceFile = this.loadSourceFile(filePath);
    const node = this.findNodeByQuery(sourceFile, query);
    await this.performInlineVariable(node);
    await sourceFile.save();
  }

  private async performInlineVariable(node: Node): Promise<void> {
    this.validateIdentifierNode(node);
    const variableName = node.getText();
    const sourceFile = node.getSourceFile();
    const declaration = this.getVariableDeclaration(sourceFile, variableName);
    const initializerText = this.getInitializerText(declaration);
    this.replaceAllReferences(sourceFile, variableName, declaration, initializerText);
    this.removeDeclaration(declaration);
  }
  
  private loadSourceFile(filePath: string) {
    const absolutePath = path.resolve(filePath);
    return this.project.addSourceFileAtPath(absolutePath);
  }

  private findNodeByQuery(sourceFile: any, query: string): Node {
    const matches = this.executeQuery(sourceFile, query);
    this.validateSingleMatch(matches, query);
    return this.convertToMorphNode(sourceFile, matches[0]);
  }

  private validateIdentifierNode(node: Node): void {
    if (node.getKind() !== 80) {
      throw new Error(`Expected identifier, got ${node.getKindName()}`);
    }
  }

  private getVariableDeclaration(sourceFile: any, variableName: string): VariableDeclaration {
    const declaration = this.findVariableDeclaration(sourceFile, variableName);
    if (!declaration) {
      throw new Error(`Variable declaration for '${variableName}' not found`);
    }
    return declaration;
  }

  private getInitializerText(declaration: VariableDeclaration): string {
    const initializer = declaration.getInitializer();
    if (!initializer) {
      throw new Error('Variable has no initializer to inline');
    }
    return initializer.getText();
  }

  private replaceAllReferences(sourceFile: any, variableName: string, declaration: VariableDeclaration, initializerText: string): void {
    const references = this.findAllReferences(sourceFile, variableName, declaration);
    for (const reference of references) {
      reference.replaceWithText(initializerText);
    }
  }

  private removeDeclaration(declaration: VariableDeclaration): void {
    const declarationStatement = declaration.getVariableStatement();
    if (declarationStatement) {
      declarationStatement.remove();
    }
  }

  private isMatchingIdentifier(node: Node, variableName: string, declarationNode: Node): boolean {
    return node.getKind() === 80 && 
           node.getText() === variableName && 
           node !== declarationNode;
  }

  private executeQuery(sourceFile: any, query: string) {
    return tsquery(sourceFile.compilerNode, query);
  }

  private validateSingleMatch(matches: any[], query: string): void {
    if (matches.length === 0) {
      throw new Error(`No matches found for query: ${query}`);
    }
    if (matches.length > 1) {
      throw new Error(`Multiple matches found for query: ${query}. Please be more specific.`);
    }
  }

  private convertToMorphNode(sourceFile: any, match: any): Node {
    const node = sourceFile.getDescendantAtPos(match.getStart());
    if (!node) {
      throw new Error(`Could not find ts-morph node for query match`);
    }
    return node;
  }

  private collectMatchingIdentifiers(sourceFile: any, variableName: string, declarationNode: Node, references: Node[]): void {
    sourceFile.forEachDescendant((node: Node) => {
      if (this.isMatchingIdentifier(node, variableName, declarationNode)) {
        references.push(node);
      }
    });
  }

  private findVariableDeclaration(sourceFile: any, variableName: string): VariableDeclaration | undefined {
    const variableDeclarations = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration);
    
    for (const decl of variableDeclarations) {
      if (decl.getName() === variableName) {
        return decl;
      }
    }
    return undefined;
  }

  private findAllReferences(sourceFile: any, variableName: string, declaration: VariableDeclaration): Node[] {
    const references: Node[] = [];
    const declarationNode = declaration.getNameNode();
    this.collectMatchingIdentifiers(sourceFile, variableName, declarationNode, references);
    return references;
  }

}