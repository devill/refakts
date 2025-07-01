import { RefactoringCommand } from '../command';
import { ExpressionLocator } from '../locators/expression-locator';
import * as path from 'path';

export class ExpressionLocatorCommand implements RefactoringCommand {
  readonly name = 'expression-locator';
  readonly description = 'Find expressions in TypeScript files';
  readonly complete = true;

  private locator = new ExpressionLocator();

  async execute(file: string, options: Record<string, any>): Promise<void> {
    this.validateOptions(options);
    const result = await this.locator.findExpressions(file, options.query);
    
    console.log(`Query: ${result.query}`);
    console.log(`Found ${result.matches.length} expressions:`);
    
    for (const match of result.matches) {
      console.log(`- ${match.expression} (${match.type}) at ${match.line}:${match.column} in ${match.scope}`);
    }
  }

  validateOptions(options: Record<string, any>): void {
    if (!options.query) {
      throw new Error('--query must be specified');
    }
  }

  getHelpText(): string {
    return '\nExamples:\n  refakts expression-locator src/file.ts --query "BinaryExpression"\n  refakts expression-locator src/file.ts --query "CallExpression"';
  }
}