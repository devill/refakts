import { SourceFile } from 'ts-morph';
import { SelectResult } from '../commands/select/select-types';
import { SelectionStrategy } from './selection-strategy';
import { RegexPatternMatcher } from '../services/regex-pattern-matcher';

export class RegexSelectionStrategy implements SelectionStrategy {
  private regexMatcher = new RegexPatternMatcher();

  canHandle(options: Record<string, any>): boolean {
    return !!options.regex && !options.range && !options.structural && !options.boundaries;
  }

  async select(sourceFile: SourceFile, options: Record<string, any>): Promise<SelectResult[]> {
    return this.regexMatcher.findRegexMatches(sourceFile, options);
  }

  validateOptions(options: Record<string, any>): void {
    if (!options.regex) {
      throw new Error('--regex must be specified');
    }
  }
}