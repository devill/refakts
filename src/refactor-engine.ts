import { Project, Node, VariableDeclaration } from 'ts-morph';
import * as path from 'path';
import { TSQueryHandler } from './tsquery-handler';
import { VariableDeclarationFinder } from './variable-declaration-finder';
import { ExpressionAnalyzer } from './expression-analyzer';
import { VariableReplacer } from './variable-replacer';
import { VariableScope } from './variable-scope';
import { RenameVariableTransformation } from './transformations/rename-variable-transformation';

export class RefactorEngine {
  private project: Project;
  private tsQueryHandler = new TSQueryHandler();
  private declarationFinder = new VariableDeclarationFinder();
  private expressionAnalyzer = new ExpressionAnalyzer();
  private variableReplacer = new VariableReplacer();
  private variableScope = new VariableScope();

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
    const sourceFile = node.getSourceFile();
    
    const transformation = new RenameVariableTransformation(node, newName);
    await transformation.transform(sourceFile);
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