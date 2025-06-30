import { RefactoringCommand } from './command';
import { RefactorEngine } from '../refactor-engine';

export class RenameCommand implements RefactoringCommand {
  private engine = new RefactorEngine();

  async execute(file: string, options: Record<string, any>): Promise<void> {
    this.validateOptions(options);
    await this.engine.renameByQuery(file, options.query, options.to);
  }

  validateOptions(options: Record<string, any>): void {
    if (!options.query) {
      throw new Error('--query must be specified');
    }
    if (!options.to) {
      throw new Error('--to must be specified for rename operations');
    }
  }
}