import { RefactoringCommand } from '../command';
import { ASTService } from '../services/ast-service';
import { ExpressionLocator } from '../locators/expression-locator';
import { Node } from 'ts-morph';
import * as yaml from 'js-yaml';

export class NodeFindingCommand implements RefactoringCommand {
  readonly name = 'node-finding';
  readonly description = 'Find AST nodes in TypeScript files';
  readonly complete = true;

  private astService = new ASTService();
  private expressionLocator: ExpressionLocator;

  constructor() {
    this.expressionLocator = new ExpressionLocator(this.astService.getProject());
  }

  async execute(file: string, options: Record<string, any>): Promise<void> {
    this.validateOptions(options);
    
    try {
      const result = this.getQueryResult(file, options);
      this.outputResult(result);
    } catch (error) {
      this.handleExecutionError(error);
    }
  }

  private async findExpressions(file: string, query: string) {
    const result = await this.expressionLocator.findExpressions(file, query);
    const serializableMatches = this.createSerializableExpressionMatches(result.matches);

    return {
      query: result.query,
      matches: serializableMatches
    };
  }

  private async findNodes(file: string, query: string) {
    const sourceFile = this.astService.loadSourceFile(file);
    const nodes = this.astService.findNodesByQuery(sourceFile, query);
    const matches = this.createNodeMatches(sourceFile, nodes);

    return {
      query,
      matches
    };
  }

  private handleExecutionError(error: unknown): void {
    console.error('Error:', error);
    process.exit(1);
  }

  private truncateText(text: string): string {
    const maxLength = 50;
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  validateOptions(options: Record<string, any>): void {
    if (!options.query) {
      throw new Error('--query must be specified');
    }
  }

  getHelpText(): string {
    return '\nExamples:\n  refakts node-finding src/file.ts --query "FunctionDeclaration"\n  refakts node-finding src/file.ts --query "BinaryExpression" --expressions\n  refakts node-finding src/file.ts --query "CallExpression" --expressions';
  }

  private async getQueryResult(file: string, options: Record<string, any>) {
    return options.expressions 
      ? await this.findExpressions(file, options.query)
      : await this.findNodes(file, options.query);
  }

  private outputResult(result: any): void {
    console.log(yaml.dump(result, { indent: 2 }));
  }

  private createSerializableExpressionMatches(matches: any[]) {
    return matches.map(match => ({
      expression: match.expression,
      type: match.type,
      line: match.line,
      column: match.column,
      scope: match.scope
    }));
  }

  private createNodeMatches(sourceFile: any, nodes: Node[]) {
    return nodes.map(node => {
      const location = sourceFile.getLineAndColumnAtPos(node.getStart());
      return {
        kind: node.getKindName(),
        text: this.truncateText(node.getText()),
        line: location.line,
        column: location.column
      };
    });
  }
}