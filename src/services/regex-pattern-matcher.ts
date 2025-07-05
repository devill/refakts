import { SourceFile } from 'ts-morph';
import { SelectResult, SelectMatch } from '../types/selection-types';
import { SelectPatternMatcher } from './selection/pattern-matcher';
import { SelectResultFormatter, BasicFormatter, LineFormatter, PreviewFormatter, DefinitionFormatter } from './selection/result-formatters';
import * as path from 'path';

interface RegexOptions {
  regex?: string | string[];
  includeDefinition?: boolean;
  'include-definition'?: boolean;
  includeLine?: boolean;
  'include-line'?: boolean;
  previewLine?: boolean;
  'preview-line'?: boolean;
  previewMatch?: boolean;
  'preview-match'?: boolean;
  [key: string]: unknown;
}

export class RegexPatternMatcher {
  private matcher = new SelectPatternMatcher();
  private formatters = new Map<string, SelectResultFormatter>([
    ['basic', new BasicFormatter()],
    ['line', new LineFormatter()],
    ['preview', new PreviewFormatter()],
    ['definition', new DefinitionFormatter()]
  ]);

  findRegexMatches(sourceFile: SourceFile, options: RegexOptions): SelectResult[] {
    const content = sourceFile.getFullText();
    const fileName = path.basename(sourceFile.getFilePath());
    const patterns = this.createRegexPatterns(options.regex || '');
    const allMatches = this.findAllPatternMatches(content, patterns);
    
    return this.processMatches(allMatches, fileName, sourceFile.getFilePath(), options);
  }

  private createRegexPatterns(regexOption: string | string[]): RegExp[] {
    const regexStrings = Array.isArray(regexOption) ? regexOption : [regexOption];
    return regexStrings.map(regex => new RegExp(regex, 'g'));
  }

  private findAllPatternMatches(content: string, patterns: RegExp[]): SelectMatch[] {
    const allMatches: SelectMatch[] = [];
    
    for (const pattern of patterns) {
      const matches = this.matcher.findMatches(content, pattern);
      allMatches.push(...matches);
    }
    
    return this.sortMatchesByPosition(allMatches);
  }

  private sortMatchesByPosition(matches: SelectMatch[]): SelectMatch[] {
    return matches.sort((a, b) => {
      if (a.line !== b.line) {
        return a.line - b.line;
      }
      return a.column - b.column;
    });
  }

  private processMatches(matches: SelectMatch[], fileName: string, filePath: string, options: RegexOptions): SelectResult[] {
    const formatter = this.determineFormatter(options);
    return formatter.format(matches, fileName, filePath);
  }

  private determineFormatter(options: RegexOptions): SelectResultFormatter {
    const formatterType = this.getFormatterType(options);
    const formatter = this.formatters.get(formatterType);
    if (!formatter) {
      throw new Error(`Unknown formatter type: ${formatterType}`);
    }
    return formatter;
  }

  private getFormatterType(options: RegexOptions): string {
    const optionChecks = this.createOptionChecks(options);
    const found = optionChecks.find(option => option.check);
    return found ? found.type : 'basic';
  }

  private createOptionChecks(options: RegexOptions) {
    return [
      { check: this.hasDefinitionOption(options), type: 'definition' },
      { check: this.hasLineOption(options), type: 'line' },
      { check: this.hasPreviewMatchOption(options), type: 'preview' },
      { check: this.hasPreviewOption(options), type: 'preview' }
    ];
  }

  private hasDefinitionOption(options: RegexOptions): boolean {
    return Boolean(options.includeDefinition || options['include-definition']);
  }

  private hasLineOption(options: RegexOptions): boolean {
    return Boolean(options.includeLine || options['include-line']);
  }

  private hasPreviewOption(options: RegexOptions): boolean {
    return Boolean(options.previewLine || options['preview-line']);
  }

  private hasPreviewMatchOption(options: RegexOptions): boolean {
    return Boolean(options.previewMatch || options['preview-match']);
  }
}