import { RefactoringCommand } from '../command';
import { Node, VariableDeclaration } from 'ts-morph';
import { ASTService } from '../services/ast-service';
import { VariableDeclarationFinder } from '../variable-declaration-finder';
import { ExpressionAnalyzer } from '../expression-analyzer';
import { VariableReplacer } from '../variable-replacer';

export class InlineVariableCommand implements RefactoringCommand {
  readonly name = 'inline-variable';
  readonly description = 'Replace variable usage with its value';
  readonly complete = true;

  private astService = new ASTService();
  private declarationFinder = new VariableDeclarationFinder();
  private expressionAnalyzer = new ExpressionAnalyzer();
  private variableReplacer = new VariableReplacer();

  async execute(file: string, options: Record<string, any>): Promise<void> {
    this.validateOptions(options);
    const sourceFile = this.astService.loadSourceFile(file);
    const node = this.astService.findNodeByQuery(sourceFile, options.query);
    await this.performInlineVariable(node);
    await this.astService.saveSourceFile(sourceFile);
  }

  validateOptions(options: Record<string, any>): void {
    if (!options.query) {
      throw new Error('--query must be specified');
    }
  }

  getHelpText(): string {
    return '\nExamples:\n  refakts inline-variable src/file.ts --query "Identifier[name=\'myVar\']"\n  refakts inline-variable src/file.ts --query "VariableDeclaration"';
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