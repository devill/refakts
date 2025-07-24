import { RefactoringCommand, CommandOptions } from '../command';
import { ConsoleOutput } from '../interfaces/ConsoleOutput';
import { Node, Expression } from 'ts-morph';
import { ASTService } from '../services/ast-service';
import { ExtractionScopeAnalyzer } from '../services/extraction-scope-analyzer';
import { VariableNameValidator } from '../services/variable-name-validator';
import { StatementInserter } from '../services/statement-inserter';
import { ExpressionMatcher } from '../services/expression-matcher';
import { LocationRange } from '../core/location-range';

export class ExtractVariableCommand implements RefactoringCommand {
  readonly name = 'extract-variable';
  readonly description = 'Extract expression into a variable';
  readonly complete = true;

  private consoleOutput!: ConsoleOutput;
  private astService = new ASTService();
  private scopeAnalyzer = new ExtractionScopeAnalyzer();
  private nameValidator = new VariableNameValidator();
  private statementInserter = new StatementInserter();
  private expressionMatcher = new ExpressionMatcher(this.scopeAnalyzer);

  async execute(file: string, options: CommandOptions): Promise<void> {
    this.validateOptions(options);
    this.astService = ASTService.createForFile(file);
    const sourceFile = this.astService.loadSourceFile(file);
    const targetNode = this.findTargetNode(options);
    await this.performExtraction(targetNode, options);
    await this.astService.saveSourceFile(sourceFile);
  }

  private findTargetNode(options: CommandOptions): Node {
    return this.astService.findNodeByLocation(options.location as LocationRange);
  }

  validateOptions(options: CommandOptions): void {
    if (!options.location) {
      throw new Error('Location format must be specified');
    }
    if (!options.name) {
      throw new Error('--name must be specified');
    }
  }

  getHelpText(): string {
    return '\nExamples:\n  refakts extract-variable "[src/file.ts 8:15-8:29]" --name "result"';
  }

  private async performExtraction(targetNode: Node, options: CommandOptions): Promise<void> {
    if (options.all) {
      await this.extractAllOccurrences(targetNode, options.name as string);
    } else {
      await this.extractSingleOccurrence(targetNode, options.name as string);
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
    const allExpressions = this.expressionMatcher.findAllMatchingExpressions(targetNode);
    this.validateExpressionsFound(allExpressions);
    
    const groupedExpressions = this.expressionMatcher.groupExpressionsByScope(allExpressions);
    this.extractInEachScope(groupedExpressions, variableName);
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

  private extractInEachScope(expressionsByScope: Map<Node, Expression[]>, variableName: string): void {
    for (const [scope, expressions] of expressionsByScope) {
      const uniqueName = this.nameValidator.generateUniqueName(variableName, scope);
      this.statementInserter.insertVariableDeclaration(expressions[0], uniqueName);
      
      for (const expression of expressions) {
        expression.replaceWithText(uniqueName);
      }
    }
  }

  setConsoleOutput(consoleOutput: ConsoleOutput): void {
    this.consoleOutput = consoleOutput;
  }
}