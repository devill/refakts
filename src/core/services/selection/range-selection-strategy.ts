import { SourceFile } from 'ts-morph';
import { SelectResult } from '../../../types/selection-types';
import { SelectionStrategy } from '../../../strategies/selection-strategy';
import { RangeAnalyzer } from '../range-analyzer';

export class RangeSelectionStrategy implements SelectionStrategy {
  private rangeAnalyzer = new RangeAnalyzer();

  canHandle(options: Record<string, unknown>): boolean {
    return !!options.range;
  }

  async select(sourceFile: SourceFile, options: Record<string, unknown>): Promise<SelectResult[]> {
    return this.rangeAnalyzer.findRangeMatches(sourceFile, options);
  }

  validateOptions(options: Record<string, unknown>): void {
    if (!options.startRegex && !options['start-regex']) {
      throw new Error('--start-regex must be specified with --range');
    }
    if (!options.endRegex && !options['end-regex']) {
      throw new Error('--end-regex must be specified with --range');
    }
  }
}