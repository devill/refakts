import { RefactoringCommand } from '../command';
import { Project, Node, VariableDeclaration } from 'ts-morph';
import { TSQueryHandler } from '../tsquery-handler';
import { VariableDeclarationFinder } from '../variable-declaration-finder';
import { ExpressionAnalyzer } from '../expression-analyzer';
import { VariableReplacer } from '../variable-replacer';
import * as path from 'path';

export class InlineVariableCommand implements RefactoringCommand {
  readonly name = 'inline-variable';
  readonly description = 'Replace variable usage with its value';
  readonly complete = true;

  private project = new Project();
  private tsQueryHandler = new TSQueryHandler();
  private declarationFinder = new VariableDeclarationFinder();
  private expressionAnalyzer = new ExpressionAnalyzer();
  private variableReplacer = new VariableReplacer();

  async execute(file: string, options: Record<string, any>): Promise<void> {
    this.validateOptions(options);
    const sourceFile = this.loadSourceFile(file);
    const node = this.tsQueryHandler.findNodeByQuery(sourceFile, options.query);
    await this.performInlineVariable(node);
    await sourceFile.save();
  }

  validateOptions(options: Record<string, any>): void {
    if (!options.query) {
      throw new Error('--query must be specified');
    }
  }

  getHelpText(): string {
    return '\nExamples:\n  refakts inline-variable src/file.ts --query "Identifier[name=\'myVar\']"\n  refakts inline-variable src/file.ts --query "VariableDeclaration"';
  }


  private loadSourceFile(filePath: string) {
    const absolutePath = path.resolve(filePath);
    return this.project.addSourceFileAtPath(absolutePath);
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