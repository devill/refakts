import { RefactoringCommand } from '../command';
import * as fs from 'fs';
import * as path from 'path';

interface SelectMatch {
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
  text: string;
  fullLine: string;
}

interface SelectResult {
  location: string;
  content?: string;
  context?: string;
}

export class SelectCommand implements RefactoringCommand {
  readonly name = 'select';
  readonly description = 'Find code elements and return their locations with content preview';
  readonly complete = true;

  async execute(file: string, options: Record<string, any>): Promise<void> {
    this.validateOptions(options);
    
    try {
      const results = await this.findMatches(file, options);
      this.outputResults(results);
    } catch (error) {
      this.handleExecutionError(error);
    }
  }

  private async findMatches(file: string, options: Record<string, any>): Promise<SelectResult[]> {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    const pattern = new RegExp(options.regex, 'g');
    const matches = this.findRegexMatches(lines, pattern);
    return this.processMatches(matches, file, options);
  }

  private findRegexMatches(lines: string[], pattern: RegExp): SelectMatch[] {
    const matches: SelectMatch[] = [];
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      
      if (this.isCommentLine(line)) {
        continue;
      }
      
      this.extractMatchesFromLine(line, lineIndex, pattern, matches);
    }
    
    return matches;
  }

  private isCommentLine(line: string): boolean {
    const trimmedLine = line.trim();
    return trimmedLine.startsWith('//') || trimmedLine.startsWith('*') || trimmedLine.startsWith('/*');
  }

  private extractMatchesFromLine(line: string, lineIndex: number, pattern: RegExp, matches: SelectMatch[]): void {
    let match;
    pattern.lastIndex = 0;
    
    while ((match = pattern.exec(line)) !== null) {
      matches.push(this.createSelectMatch(match, lineIndex, line));
    }
  }

  private createSelectMatch(match: RegExpExecArray, lineIndex: number, line: string): SelectMatch {
    return {
      line: lineIndex + 1,
      column: match.index + 1,
      endLine: lineIndex + 1,
      endColumn: match.index + match[0].length + 1,
      text: match[0],
      fullLine: line
    };
  }

  private processMatches(matches: SelectMatch[], file: string, options: Record<string, any>): SelectResult[] {
    const fileName = path.basename(file);
    const results: SelectResult[] = [];

    for (const match of matches) {
      const result = this.createSelectResult(match, fileName, file, options);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  private createSelectResult(match: SelectMatch, fileName: string, file: string, options: Record<string, any>): SelectResult | null {
    if (options.includeDefinition || options['include-definition']) {
      return this.createDefinitionResult(match, fileName, file);
    } else if (options.includeLine || options['include-line']) {
      return this.createLineResult(match, fileName);
    } else if (options.previewLine || options['preview-line']) {
      return this.createPreviewResult(match, fileName);
    } else {
      return this.createBasicResult(match, fileName);
    }
  }

  private createDefinitionResult(match: SelectMatch, fileName: string, file: string): SelectResult | null {
    const definitionRange = this.findDefinitionRange(match, file);
    if (definitionRange) {
      return {
        location: `[${fileName} ${definitionRange.startLine}:-${definitionRange.endLine}:]`,
        content: definitionRange.content
      };
    }
    return null;
  }

  private createLineResult(match: SelectMatch, fileName: string): SelectResult {
    return {
      location: `[${fileName} ${match.line}:-${match.line}:]`,
      content: match.fullLine.trim()
    };
  }

  private createPreviewResult(match: SelectMatch, fileName: string): SelectResult {
    return {
      location: `[${fileName} ${match.line}:${match.column}-${match.endLine}:${match.endColumn}]`,
      content: match.fullLine.trim()
    };
  }

  private createBasicResult(match: SelectMatch, fileName: string): SelectResult {
    return {
      location: `[${fileName} ${match.line}:${match.column}-${match.endLine}:${match.endColumn}]`,
      content: match.text
    };
  }

  private findDefinitionRange(match: SelectMatch, file: string): { startLine: number; endLine: number; content: string } | null {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    const matchLine = match.line - 1;
    
    if (!this.isDefinitionLine(lines[matchLine])) {
      return null;
    }
    
    const endLine = this.findDefinitionEndLine(lines, matchLine);
    const definitionContent = lines.slice(matchLine, endLine + 1).join('\n');
    
    return {
      startLine: matchLine + 1,
      endLine: endLine + 1,
      content: definitionContent
    };
  }

  private isDefinitionLine(line: string): boolean {
    return line.includes('function ') || line.includes('const ') || line.includes('let ') || line.includes('var ');
  }

  private findDefinitionEndLine(lines: string[], startLine: number): number {
    let endLine = startLine;
    let braceCount = 0;
    let foundOpenBrace = false;
    
    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i];
      
      for (const char of line) {
        if (char === '{') {
          braceCount++;
          foundOpenBrace = true;
        } else if (char === '}') {
          braceCount--;
          if (foundOpenBrace && braceCount === 0) {
            endLine = i;
            break;
          }
        }
      }
      
      if (foundOpenBrace && braceCount === 0) {
        break;
      }
    }
    
    return endLine;
  }

  private outputResults(results: SelectResult[]): void {
    for (const result of results) {
      this.outputSingleResult(result);
    }
  }

  private outputSingleResult(result: SelectResult): void {
    if (result.content && result.context) {
      this.outputPreviewResult(result);
    } else if (this.isMultiLineResult(result)) {
      this.outputMultiLineResult(result);
    } else if (result.content) {
      console.log(`${result.location} ${result.content}`);
    } else {
      console.log(result.location);
    }
  }

  private outputPreviewResult(result: SelectResult): void {
    console.log(`${result.location} ${result.content}`);
    console.log(`Context: ${result.context}`);
  }

  private isMultiLineResult(result: SelectResult): boolean {
    if (!result.content || !result.location.includes(':-') || !result.location.includes(':')) {
      return false;
    }
    const hasMultiLineRange = result.location.match(/(\d+):-(\d+):/);
    return hasMultiLineRange ? hasMultiLineRange[1] !== hasMultiLineRange[2] : false;
  }

  private outputMultiLineResult(result: SelectResult): void {
    console.log(result.location);
    console.log(result.content);
    console.log(result.location);
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