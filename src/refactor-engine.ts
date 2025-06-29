import { Project, Node, VariableDeclaration } from 'ts-morph';
import * as path from 'path';
import { TSQueryHandler } from './tsquery-handler';
import { VariableDeclarationFinder } from './variable-declaration-finder';
import { ExpressionAnalyzer } from './expression-analyzer';
import { VariableReplacer } from './variable-replacer';

export class RefactorEngine {
  private project: Project;
  private tsQueryHandler = new TSQueryHandler();
  private declarationFinder = new VariableDeclarationFinder();
  private expressionAnalyzer = new ExpressionAnalyzer();
  private variableReplacer = new VariableReplacer();

  constructor() {
    this.project = new Project();
  }

  async inlineVariableByQuery(filePath: string, query: string): Promise<void> {
    const sourceFile = this.loadSourceFile(filePath);
    const node = this.tsQueryHandler.findNodeByQuery(sourceFile, query);
    await this.performInlineVariable(node);
    await sourceFile.save();
  }

  async renameByQuery(filePath: string, query: string, newName: string): Promise<void> {
    const sourceFile = this.loadSourceFile(filePath);
    const node = this.tsQueryHandler.findNodeByQuery(sourceFile, query);
    await this.performRename(node, newName);
    await sourceFile.save();
  }

  private async performInlineVariable(node: Node): Promise<void> {
    this.validateIdentifierNode(node);
    const variableName = node.getText();
    const sourceFile = node.getSourceFile();
    const declaration = this.declarationFinder.findVariableDeclaration(sourceFile, variableName);
    const initializerText = this.getInitializerText(declaration, variableName);
    this.variableReplacer.replaceAllReferences(sourceFile, variableName, declaration, initializerText);
    this.variableReplacer.removeDeclaration(declaration);
  }

  private async performRename(node: Node, newName: string): Promise<void> {
    this.validateIdentifierNode(node);
    const oldName = node.getText();
    const sourceFile = node.getSourceFile();
    
    // Rename the declaration itself
    node.replaceWithText(newName);
    
    // Find all references to this identifier and rename them
    const references = this.findAllReferences(sourceFile, oldName, node);
    references.forEach(ref => {
      ref.replaceWithText(newName);
    });
  }

  private findAllReferences(sourceFile: any, variableName: string, declarationNode: Node): Node[] {
    const references: Node[] = [];
    
    sourceFile.forEachDescendant((node: Node) => {
      if (node.getKind() === 80 && 
          node.getText() === variableName && 
          node !== declarationNode) {
        references.push(node);
      }
    });
    return references;
  }

  private getDeclarationScope(declarationNode: Node): Node {
    // Check if this is a parameter identifier  
    const parent = declarationNode.getParent();
    if (parent && Node.isParameterDeclaration(parent)) {
      // For parameters, scope is the entire function
      const functionNode = parent.getParent();
      if (functionNode && (Node.isFunctionDeclaration(functionNode) || Node.isArrowFunction(functionNode))) {
        return functionNode;
      }
    }
    
    // Find the closest function or block scope for regular variables
    let current = declarationNode.getParent();
    while (current) {
      if (Node.isFunctionDeclaration(current) || 
          Node.isArrowFunction(current) || 
          Node.isBlock(current) ||
          Node.isSourceFile(current)) {
        return current;
      }
      current = current.getParent();
    }
    return declarationNode.getSourceFile();
  }

  private isInSameScope(node: Node, targetScope: Node): boolean {
    let current = node.getParent();
    while (current) {
      if (current === targetScope) {
        return true;
      }
      if (Node.isFunctionDeclaration(current) || 
          Node.isArrowFunction(current) || 
          Node.isBlock(current)) {
        return false;
      }
      current = current.getParent();
    }
    return false;
  }

  private loadSourceFile(filePath: string) {
    const absolutePath = path.resolve(filePath);
    return this.project.addSourceFileAtPath(absolutePath);
  }

  private validateIdentifierNode(node: Node): void {
    if (node.getKind() !== 80) {
      throw new Error(`Expected identifier, got ${node.getKindName()}`);
    }
  }

  private getInitializerText(declaration: VariableDeclaration, variableName?: string, context?: Node): string {
    const nameNode = declaration.getNameNode();
    
    if (Node.isObjectBindingPattern(nameNode) && variableName) {
      return this.getDestructuringInitializer(declaration, variableName);
    }
    
    return this.getRegularInitializer(declaration, context);
  }

  private getDestructuringInitializer(declaration: VariableDeclaration, variableName: string): string {
    const initializer = declaration.getInitializer();
    if (!initializer) {
      throw new Error('Destructuring declaration has no initializer to inline');
    }
    
    const initializerText = initializer.getText();
    return `${initializerText}.${variableName}`;
  }

  private getRegularInitializer(declaration: VariableDeclaration, context?: Node): string {
    const initializer = declaration.getInitializer();
    if (!initializer) {
      throw new Error('Variable has no initializer to inline');
    }
    
    return this.expressionAnalyzer.formatWithParentheses(initializer, context);
  }
}