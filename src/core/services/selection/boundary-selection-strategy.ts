import { SourceFile } from 'ts-morph';
import { SelectResult } from '../../../types/selection-types';
import { SelectionStrategy } from './selection-strategy';
import { BoundaryAnalyzer } from '../boundary-analyzer';

export class BoundarySelectionStrategy implements SelectionStrategy {
  private boundaryAnalyzer = new BoundaryAnalyzer();

  canHandle(options: Record<string, unknown>): boolean {
    return !!options.boundaries;
  }

  async select(sourceFile: SourceFile, options: Record<string, unknown>): Promise<SelectResult[]> {
    return this.boundaryAnalyzer.findBoundaryMatches(sourceFile, options);
  }

  validateOptions(options: Record<string, unknown>): void {
    if (!options.regex) {
      throw new Error('--regex must be specified with --boundaries');
    }
  }
}