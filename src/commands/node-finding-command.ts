import { RefactoringCommand } from '../command';
import { Project } from 'ts-morph';
import { TSQueryHandler } from '../tsquery-handler';
import * as path from 'path';

export class NodeFindingCommand implements RefactoringCommand {
  readonly name = 'node-finding';
  readonly description = 'Find AST nodes in TypeScript files';
  readonly complete = false;

  private project = new Project();
  private tsQueryHandler = new TSQueryHandler();

  async execute(file: string, options: Record<string, any>): Promise<void> {
    this.validateOptions(options);
    const sourceFile = this.loadSourceFile(file);
    const nodes = this.tsQueryHandler.findNodesByQuery(sourceFile, options.query);
    
    console.log(`Found ${nodes.length} matching nodes:`);
    for (const node of nodes) {
      console.log(`- ${node.getKindName()}: "${node.getText()}"`);
    }
  }

  validateOptions(options: Record<string, any>): void {
    if (!options.query) {
      throw new Error('--query must be specified');
    }
  }

  getHelpText(): string {
    return '\nExamples:\n  refakts node-finding src/file.ts --query "FunctionDeclaration"\n  (Currently incomplete - implementation in progress)';
  }

  private loadSourceFile(filePath: string) {
    const absolutePath = path.resolve(filePath);
    return this.project.addSourceFileAtPath(absolutePath);
  }
}