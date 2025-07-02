import { RefactoringCommand } from '../command';
import { ASTService } from '../services/ast-service';
import { ExpressionLocator } from '../locators/expression-locator';
import { Node } from 'ts-morph';

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
    
    if (options.expressions) {
      await this.findExpressions(file, options.query);
    } else {
      await this.findNodes(file, options.query);
    }
  }

  private async findExpressions(file: string, query: string): Promise<void> {
    const result = await this.expressionLocator.findExpressions(file, query);
    console.log(`Query: ${result.query}`);
    console.log(`Found ${result.matches.length} expressions:`);
    
    for (const match of result.matches) {
      console.log(`- ${match.expression} (${match.type}) at ${match.line}:${match.column} in ${match.scope}`);
    }
  }

  private async findNodes(file: string, query: string): Promise<void> {
    const sourceFile = this.astService.loadSourceFile(file);
    const nodes = this.astService.findNodesByQuery(sourceFile, query);
    
    console.log(`Found ${nodes.length} matching nodes:`);
    for (const node of nodes) {
      const location = sourceFile.getLineAndColumnAtPos(node.getStart());
      console.log(`- ${node.getKindName()}: "${this.truncateText(node.getText())}" at ${location.line}:${location.column}`);
    }
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
}