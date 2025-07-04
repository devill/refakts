import { SourceFile } from 'ts-morph';
import { SelectResult, SelectMatch } from '../types/selection-types';
import { SelectPatternMatcher } from '../services/selection/pattern-matcher';
import { SelectResultFormatter, BasicFormatter, LineFormatter, PreviewFormatter, DefinitionFormatter } from '../services/selection/result-formatters';
import * as path from 'path';

export class RegexPatternMatcher {
  private matcher = new SelectPatternMatcher();
  private formatters = new Map<string, SelectResultFormatter>([
    ['basic', new BasicFormatter()],
    ['line', new LineFormatter()],
    ['preview', new PreviewFormatter()],
    ['definition', new DefinitionFormatter()]
  ]);

  findRegexMatches(sourceFile: SourceFile, options: Record<string, any>): SelectResult[] {
    const content = sourceFile.getFullText();
    const fileName = path.basename(sourceFile.getFilePath());
    const patterns = this.createRegexPatterns(options.regex);
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

  private processMatches(matches: SelectMatch[], fileName: string, filePath: string, options: Record<string, any>): SelectResult[] {
    const formatter = this.determineFormatter(options);
    return formatter.format(matches, fileName, filePath);
  }

  private determineFormatter(options: Record<string, any>): SelectResultFormatter {
    const formatterType = this.getFormatterType(options);
    return this.formatters.get(formatterType)!;
  }

  private getFormatterType(options: Record<string, any>): string {
    const optionChecks = this.createOptionChecks(options);
    const found = optionChecks.find(option => option.check);
    return found ? found.type : 'basic';
  }

  private createOptionChecks(options: Record<string, any>) {
    return [
      { check: this.hasDefinitionOption(options), type: 'definition' },
      { check: this.hasLineOption(options), type: 'line' },
      { check: this.hasPreviewMatchOption(options), type: 'preview' },
      { check: this.hasPreviewOption(options), type: 'preview' }
    ];
  }

  private hasDefinitionOption(options: Record<string, any>): boolean {
    return options.includeDefinition || options['include-definition'];
  }

  private hasLineOption(options: Record<string, any>): boolean {
    return options.includeLine || options['include-line'];
  }

  private hasPreviewOption(options: Record<string, any>): boolean {
    return options.previewLine || options['preview-line'];
  }

  private hasPreviewMatchOption(options: Record<string, any>): boolean {
    return options.previewMatch || options['preview-match'];
  }
}