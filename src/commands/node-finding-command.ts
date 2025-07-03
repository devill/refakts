import { RefactoringCommand } from '../command';
import { NodeFinderFactory } from '../strategies/node-finder-factory';
import * as yaml from 'js-yaml';

export class NodeFindingCommand implements RefactoringCommand {
  readonly name = 'node-finding';
  readonly description = 'Find AST nodes in TypeScript files';
  readonly complete = true;

  async execute(file: string, options: Record<string, any>): Promise<void> {
    this.validateOptions(options);
    
    try {
      const result = await this.executeSearch(file, options);
      this.outputResult(result);
    } catch (error) {
      this.handleExecutionError(error);
    }
  }

  private async executeSearch(file: string, options: Record<string, any>) {
    const nodeFinder = NodeFinderFactory.create(options);
    const pattern = options.regex || options.query;
    
    return options.expressions 
      ? await nodeFinder.findExpressions(file, pattern)
      : nodeFinder.findNodes(file, pattern);
  }


  private handleExecutionError(error: unknown): void {
    console.error('Error:', error);
    process.exit(1);
  }

  validateOptions(options: Record<string, any>): void {
    if (!options.query && !options.regex) {
      throw new Error('Either --query or --regex must be specified');
    }
    if (options.query && options.regex) {
      throw new Error('Cannot specify both --query and --regex');
    }
  }

  getHelpText(): string {
    return '\nExamples:\n  refakts node-finding src/file.ts --query "FunctionDeclaration"\n  refakts node-finding src/file.ts --query "BinaryExpression" --expressions\n  refakts node-finding src/file.ts --regex "function calculate\\w+"\n  refakts node-finding src/file.ts --regex "result" --expressions';
  }

  private outputResult(result: any): void {
    console.log(yaml.dump(result, { indent: 2 }));
  }
}