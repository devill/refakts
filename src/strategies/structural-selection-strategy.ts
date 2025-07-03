import { SourceFile } from 'ts-morph';
import { SelectResult } from '../commands/select/select-types';
import { SelectionStrategy } from './selection-strategy';
import { StructuralAnalyzer } from '../services/structural-analyzer';

export class StructuralSelectionStrategy implements SelectionStrategy {
  private structuralAnalyzer = new StructuralAnalyzer();

  canHandle(options: Record<string, any>): boolean {
    return !!options.structural;
  }

  async select(sourceFile: SourceFile, options: Record<string, any>): Promise<SelectResult[]> {
    return this.structuralAnalyzer.findStructuralMatches(sourceFile, options);
  }

  validateOptions(options: Record<string, any>): void {
    if (!options.regex) {
      throw new Error('--regex must be specified with --structural');
    }
  }
}