import { SourceFile } from 'ts-morph';
import { SelectResult, SelectMatch, SelectMatchSorter } from '../../../core/services/selection/selection-types';
import { SelectPatternMatcher } from '../../../services/selection/pattern-matcher';
import { SelectResultFormatter, BasicFormatter, LineFormatter, PreviewFormatter, DefinitionFormatter } from '../result-formatters';
import { MatchContext } from '../match-context';
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
    const context = MatchContext.fromContent(content, fileName, sourceFile.getFilePath());
    const patterns = this.createRegexPatterns(options.regex || '');
    const allMatches = this.findAllPatternMatches(content, patterns);
    
    return this.processMatches(allMatches, context, options);
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
    
    return SelectMatchSorter.sortByPosition(allMatches);
  }


  private processMatches(matches: SelectMatch[], context: MatchContext, options: RegexOptions): SelectResult[] {
    const formatter = this.determineFormatter(options);
    return formatter.format(matches, context.fileName, context.content);
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
    const hasExplicitPreviewOption = options.previewLine !== undefined || options['preview-line'] !== undefined;
    return hasExplicitPreviewOption ? 
      Boolean(options.previewLine || options['preview-line']) : 
      true;
  }

  private hasPreviewMatchOption(options: RegexOptions): boolean {
    return Boolean(options.previewMatch || options['preview-match']);
  }
}