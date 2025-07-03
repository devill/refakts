import { SourceFile } from 'ts-morph';
import { SelectResult } from '../commands/select/select-types';
import { SelectionStrategy } from './selection-strategy';
import { BoundaryAnalyzer } from '../services/boundary-analyzer';

export class BoundarySelectionStrategy implements SelectionStrategy {
  private boundaryAnalyzer = new BoundaryAnalyzer();

  canHandle(options: Record<string, any>): boolean {
    return !!options.boundaries;
  }

  async select(sourceFile: SourceFile, options: Record<string, any>): Promise<SelectResult[]> {
    return this.boundaryAnalyzer.findBoundaryMatches(sourceFile, options);
  }

  validateOptions(options: Record<string, any>): void {
    if (!options.regex) {
      throw new Error('--regex must be specified with --boundaries');
    }
  }
}