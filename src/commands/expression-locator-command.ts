import { RefactoringCommand } from '../command';
import { ASTService } from '../services/ast-service';
import { ExpressionLocator } from '../locators/expression-locator';

export class ExpressionLocatorCommand implements RefactoringCommand {
  readonly name = 'expression-locator';
  readonly description = 'Find expressions in TypeScript files';
  readonly complete = true;

  private astService = new ASTService();
  private locator: ExpressionLocator;

  constructor() {
    this.locator = new ExpressionLocator(this.astService.getProject());
  }

  async execute(file: string, options: Record<string, any>): Promise<void> {
    this.validateOptions(options);
    const result = await this.locator.findExpressions(file, options.query);
    this.displayResults(result);
  }

  private displayResults(result: any): void {
    console.log(`Query: ${result.query}`);
    console.log(`Found ${result.matches.length} expressions:`);
    this.displayMatches(result.matches);
  }

  private displayMatches(matches: any[]): void {
    for (const match of matches) {
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