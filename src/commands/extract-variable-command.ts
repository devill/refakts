import { RefactoringCommand } from '../command';
import { Node, Expression } from 'ts-morph';
import { ASTService } from '../services/ast-service';
import { ExtractionScopeAnalyzer } from '../services/extraction-scope-analyzer';
import { VariableNameValidator } from '../services/variable-name-validator';
import { StatementInserter } from '../services/statement-inserter';

export class ExtractVariableCommand implements RefactoringCommand {
  readonly name = 'extract-variable';
  readonly description = 'Extract expression into a variable';
  readonly complete = true;

  private astService = new ASTService();
  private scopeAnalyzer = new ExtractionScopeAnalyzer();
  private nameValidator = new VariableNameValidator();
  private statementInserter = new StatementInserter();

  async execute(file: string, options: Record<string, any>): Promise<void> {
    this.validateOptions(options);
    const sourceFile = this.astService.loadSourceFile(file);
    const targetNode = this.astService.findTargetNode(sourceFile, options.query);
    
    await this.performExtraction(targetNode, options);
    await this.astService.saveSourceFile(sourceFile);
  }

  validateOptions(options: Record<string, any>): void {
    if (!options.query) {
      throw new Error('--query must be specified');
    }
    if (!options.name) {
      throw new Error('--name must be specified');
    }
  }

  getHelpText(): string {
    return '\nExamples:\n  refakts extract-variable src/file.ts --query "BinaryExpression" --name "result"\n  refakts extract-variable src/file.ts --query "CallExpression" --name "result" --all';
  }

  private async performExtraction(targetNode: Node, options: Record<string, any>): Promise<void> {
    if (options.all) {
      await this.extractAllOccurrences(targetNode, options.name);
    } else {
      await this.extractSingleOccurrence(targetNode, options.name);
    }
  }

  private async extractSingleOccurrence(targetNode: Node, variableName: string): Promise<void> {
    this.validateExpressionNode(targetNode);
    const scope = this.scopeAnalyzer.findExtractionScope(targetNode);
    const uniqueName = this.nameValidator.generateUniqueName(variableName, scope);
    
    this.statementInserter.insertVariableDeclaration(targetNode, uniqueName);
    targetNode.replaceWithText(uniqueName);
  }

  private async extractAllOccurrences(targetNode: Node, variableName: string): Promise<void> {
    this.validateExpressionNode(targetNode);
    const allExpressions = this.findAllMatchingExpressions(targetNode);
    this.validateExpressionsFound(allExpressions);
    
    const groupedExpressions = this.groupExpressionsByScope(allExpressions);
    this.extractInEachScope(groupedExpressions, variableName);
  }

  private findAllMatchingExpressions(targetNode: Node): Expression[] {
    const expressionText = targetNode.getText();
    const sourceFile = targetNode.getSourceFile();
    return this.findMatchingExpressions(sourceFile, expressionText);
  }

  private validateExpressionNode(node: Node): void {
    if (!Node.isExpression(node)) {
      throw new Error('Selected node must be an expression');
    }
  }

  private validateExpressionsFound(expressions: Expression[]): void {
    if (expressions.length === 0) {
      throw new Error('No matching expressions found');
    }
  }

  private groupExpressionsByScope(expressions: Expression[]): Map<Node, Expression[]> {
    const groupedExpressions = new Map<Node, Expression[]>();
    
    for (const expression of expressions) {
      this.addExpressionToScope(groupedExpressions, expression);
    }
    
    return groupedExpressions;
  }

  private addExpressionToScope(groupedExpressions: Map<Node, Expression[]>, expression: Expression): void {
    const scope = this.scopeAnalyzer.findExtractionScope(expression);
    if (!groupedExpressions.has(scope)) {
      groupedExpressions.set(scope, []);
    }
    groupedExpressions.get(scope)!.push(expression);
  }

  private extractInEachScope(expressionsByScope: Map<Node, Expression[]>, variableName: string): void {
    for (const [scope, expressions] of expressionsByScope) {
      const uniqueName = this.nameValidator.generateUniqueName(variableName, scope);
      this.statementInserter.insertVariableDeclaration(expressions[0], uniqueName);
      
      for (const expression of expressions) {
        expression.replaceWithText(uniqueName);
      }
    }
  }

  private findMatchingExpressions(scope: Node, expressionText: string): Expression[] {
    const expressions: Expression[] = [];
    
    scope.forEachDescendant((node) => {
      this.addMatchingExpression(node, expressionText, expressions);
    });
    
    return expressions;
  }

  private addMatchingExpression(node: Node, expressionText: string, expressions: Expression[]): void {
    if (Node.isExpression(node) && node.getText() === expressionText) {
      expressions.push(node);
    }
  }
}