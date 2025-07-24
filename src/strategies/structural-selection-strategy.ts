import { SourceFile } from 'ts-morph';
import { SelectResult } from '../types/selection-types';
import { SelectionStrategy } from './selection-strategy';
import { StructuralAnalyzer } from '../core/services/structural-analyzer';

export class StructuralSelectionStrategy implements SelectionStrategy {
  private structuralAnalyzer = new StructuralAnalyzer();

  canHandle(options: Record<string, unknown>): boolean {
    return !!options.structural;
  }

  async select(sourceFile: SourceFile, options: Record<string, unknown>): Promise<SelectResult[]> {
    return this.structuralAnalyzer.findStructuralMatches(sourceFile, options);
  }

  validateOptions(options: Record<string, unknown>): void {
    if (!options.regex) {
      throw new Error('--regex must be specified with --structural');
    }
  }
}