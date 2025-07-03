import { RefactoringCommand } from '../command';
import * as fs from 'fs';
import * as path from 'path';
import { SelectMatch, SelectResult } from './select/select-types';
import { SelectPatternMatcher } from './select/pattern-matcher';
import { SelectResultFormatter, BasicFormatter, LineFormatter, PreviewFormatter, DefinitionFormatter } from './select/result-formatters';
import { SelectOutputHandler } from './select/output-handler';

export class SelectCommand implements RefactoringCommand {
  readonly name = 'select';
  readonly description = 'Find code elements and return their locations with content preview';
  readonly complete = true;

  private matcher = new SelectPatternMatcher();
  private outputHandler = new SelectOutputHandler();
  private formatters = new Map<string, SelectResultFormatter>([
    ['basic', new BasicFormatter()],
    ['line', new LineFormatter()],
    ['preview', new PreviewFormatter()],
    ['definition', new DefinitionFormatter()]
  ]);

  async execute(file: string, options: Record<string, any>): Promise<void> {
    this.validateOptions(options);
    
    try {
      const results = await this.findMatches(file, options);
      this.outputHandler.outputResults(results);
    } catch (error) {
      this.handleExecutionError(error);
    }
  }

  private async findMatches(file: string, options: Record<string, any>): Promise<SelectResult[]> {
    const content = fs.readFileSync(file, 'utf8');
    const pattern = new RegExp(options.regex, 'g');
    const matches = this.matcher.findMatches(content, pattern);
    return this.processMatches(matches, file, options);
  }


  private processMatches(matches: SelectMatch[], file: string, options: Record<string, any>): SelectResult[] {
    const fileName = path.basename(file);
    const formatter = this.determineFormatter(options);
    return formatter.format(matches, fileName, file);
  }

  private determineFormatter(options: Record<string, any>): SelectResultFormatter {
    if (options.includeDefinition || options['include-definition']) {
      return this.formatters.get('definition')!;
    } else if (options.includeLine || options['include-line']) {
      return this.formatters.get('line')!;
    } else if (options.previewLine || options['preview-line']) {
      return this.formatters.get('preview')!;
    } else {
      return this.formatters.get('basic')!;
    }
  }



  private handleExecutionError(error: unknown): void {
    console.error('Error:', error);
    process.exit(1);
  }

  validateOptions(options: Record<string, any>): void {
    if (!options.regex) {
      throw new Error('--regex must be specified');
    }
  }

  getHelpText(): string {
    return '\nExamples:\n  refakts select src/file.ts --regex "tempResult"\n  refakts select src/file.ts --regex "calculateTotal" --include-definition\n  refakts select src/file.ts --regex "tempResult" --include-line\n  refakts select src/file.ts --regex "tempResult" --preview-line';
  }
}