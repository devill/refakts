import { SourceFile } from 'ts-morph';
import { SelectResult } from '../../../types/selection-types';
import { SelectionStrategy } from '../../../strategies/selection-strategy';
import { RegexPatternMatcher } from '../../../services/regex-pattern-matcher';

export class RegexSelectionStrategy implements SelectionStrategy {
  private regexMatcher = new RegexPatternMatcher();

  canHandle(options: Record<string, unknown>): boolean {
    return !!options.regex && !options.range && !options.structural && !options.boundaries;
  }

  async select(sourceFile: SourceFile, options: Record<string, unknown>): Promise<SelectResult[]> {
    return this.regexMatcher.findRegexMatches(sourceFile, options);
  }

  validateOptions(options: Record<string, unknown>): void {
    if (!options.regex) {
      throw new Error('--regex must be specified');
    }
  }
}