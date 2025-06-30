import { RefactoringCommand } from './command';
import { RefactorEngine } from '../refactor-engine';

export class InlineVariableCommand implements RefactoringCommand {
  private engine = new RefactorEngine();

  async execute(file: string, options: Record<string, any>): Promise<void> {
    this.validateOptions(options);
    await this.engine.inlineVariableByQuery(file, options.query);
  }

  validateOptions(options: Record<string, any>): void {
    if (!options.query) {
      throw new Error('--query must be specified');
    }
  }
}