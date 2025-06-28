import { Project, Node, VariableDeclaration, SyntaxKind } from 'ts-morph';
import { tsquery } from '@phenomnomnominal/tsquery';
import * as path from 'path';

export class RefactorEngine {
  private project: Project;

  constructor() {
    this.project = new Project();
  }


  async inlineVariableByQuery(filePath: string, query: string): Promise<void> {
    const absolutePath = path.resolve(filePath);
    const sourceFile = this.project.addSourceFileAtPath(absolutePath);
    const ast = sourceFile.compilerNode;
    
    const matches = tsquery(ast, query);
    if (matches.length === 0) {
      throw new Error(`No matches found for query: ${query}`);
    }

    if (matches.length > 1) {
      throw new Error(`Multiple matches found for query: ${query}. Please be more specific.`);
    }

    const tsNode = matches[0];
    const node = sourceFile.getDescendantAtPos(tsNode.getStart());
    
    if (!node) {
      throw new Error(`Could not find ts-morph node for query match`);
    }
    
    await this.performInlineVariable(node);
    await sourceFile.save();
  }

  private async performInlineVariable(node: Node): Promise<void> {
    // The node should be an identifier to inline
    if (node.getKind() !== 80) { // SyntaxKind.Identifier
      throw new Error(`Expected identifier, got ${node.getKindName()}`);
    }
    
    const identifier = node;
    const variableName = identifier.getText();
    const sourceFile = identifier.getSourceFile();
    
    // Find the variable declaration
    const declaration = this.findVariableDeclaration(sourceFile, variableName);
    if (!declaration) {
      throw new Error(`Variable declaration for '${variableName}' not found`);
    }
    
    const initializer = declaration.getInitializer();
    if (!initializer) {
      throw new Error('Variable has no initializer to inline');
    }
    
    // Find all references to this variable and replace them
    const references = this.findAllReferences(sourceFile, variableName, declaration);
    const initializerText = initializer.getText();
    
    for (const reference of references) {
      reference.replaceWithText(initializerText);
    }
    
    // Remove the declaration statement
    const declarationStatement = declaration.getVariableStatement();
    if (declarationStatement) {
      declarationStatement.remove();
    }
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
  
  private isPartOfVariableDeclaration(node: Node): boolean {
    let current = node.getParent();
    while (current) {
      if (current.getKind() === SyntaxKind.VariableDeclaration) {
        return true;
      }
      current = current.getParent();
    }
    return false;
  }

  private findAllReferences(sourceFile: any, variableName: string, declaration: VariableDeclaration): Node[] {
    const references: Node[] = [];
    
    sourceFile.forEachDescendant((node: Node) => {
      if (node.getKind() === 80 && // SyntaxKind.Identifier
          node.getText() === variableName &&
          node !== declaration.getNameNode()) {
        references.push(node);
      }
    });
    
    return references;
  }

}