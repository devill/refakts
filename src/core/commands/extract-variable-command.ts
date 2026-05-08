import { RefactoringCommand, CommandOptions } from './command';
import { ConsoleOutput } from '../../command-line-parser/output-formatter/console-output';
import { Node, Expression } from 'ts-morph';
import { RefactoringCommandResult } from './result-types/refactoring-result';
import { ASTService } from '../ast/ast-service';
import { ExtractionScopeAnalyzer } from '../services/extraction-scope-analyzer';
import { VariableNameValidator } from '../services/variable-name-validator';
import { StatementInserter } from '../transformations/statement-inserter';
import { ExpressionMatcher } from '../services/expression-matcher';
import { LocationRange } from '../ast/location-range';

export class ExtractVariableCommand implements RefactoringCommand {
  readonly name = 'extract-variable';
  readonly description = 'Extract expression into a variable';
  readonly complete = true;

  private consoleOutput!: ConsoleOutput;
  private astService!: ASTService;
  private scopeAnalyzer = new ExtractionScopeAnalyzer();
  private nameValidator = new VariableNameValidator();
  private statementInserter = new StatementInserter();
  private expressionMatcher = new ExpressionMatcher(this.scopeAnalyzer);

  async execute(file: string, options: CommandOptions): Promise<RefactoringCommandResult> {
    this.validateOptions(options);
    const location = LocationRange.from(options.location as LocationRange);
    this.astService = ASTService.createForFile(file);
    const count = await this.performExtraction(this.astService.findNodeByLocation(location), options);
    await this.astService.saveSourceFile(this.astService.loadSourceFile(file));
    const variableName = options.name as string;
    const message = options.all
      ? `Successfully extracted variable '${variableName}' (${count} occurrence${count === 1 ? '' : 's'} replaced)`
      : `Successfully extracted variable '${variableName}'`;
    return new RefactoringCommandResult(message);
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

  private async performExtraction(targetNode: Node, options: CommandOptions): Promise<number> {
    if (options.all) {
      return await this.extractAllOccurrences(targetNode, options.name as string);
    } else {
      await this.extractSingleOccurrence(targetNode, options.name as string);
      return 1;
    }
  }

  private async extractSingleOccurrence(targetNode: Node, variableName: string): Promise<void> {
    this.validateExpressionNode(targetNode);
    const uniqueName = this.nameValidator.generateUniqueName(variableName, this.scopeAnalyzer.findExtractionScope(targetNode));

    this.statementInserter.insertVariableDeclaration(targetNode, uniqueName);
    targetNode.replaceWithText(uniqueName);
  }

  private async extractAllOccurrences(targetNode: Node, variableName: string): Promise<number> {
    this.validateExpressionNode(targetNode);
    const allExpressions = this.expressionMatcher.findAllMatchingExpressions(targetNode);
    this.validateExpressionsFound(allExpressions);

    this.extractInEachScope(this.expressionMatcher.groupExpressionsByScope(allExpressions), variableName);
    return allExpressions.length;
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
    for (const [scope, expressions] of Array.from(expressionsByScope.entries())) {
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