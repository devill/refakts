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
    const matches: SelectMatch[] = [];

    // Find all matches, excluding comments
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      
      // Skip lines that are comments
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('//') || trimmedLine.startsWith('*') || trimmedLine.startsWith('/*')) {
        continue;
      }
      
      let match;
      
      // Reset regex lastIndex for each line
      pattern.lastIndex = 0;
      
      while ((match = pattern.exec(line)) !== null) {
        const startColumn = match.index + 1; // 1-based
        const endColumn = match.index + match[0].length + 1; // 1-based
        
        matches.push({
          line: lineIndex + 1, // 1-based
          column: startColumn,
          endLine: lineIndex + 1,
          endColumn: endColumn,
          text: match[0],
          fullLine: line
        });
      }
    }

    return this.processMatches(matches, file, options);
  }

  private processMatches(matches: SelectMatch[], file: string, options: Record<string, any>): SelectResult[] {
    const fileName = path.basename(file);
    const results: SelectResult[] = [];

    for (const match of matches) {
      if (options.includeDefinition || options['include-definition']) {
        const definitionRange = this.findDefinitionRange(match, file);
        if (definitionRange) {
          results.push({
            location: `[${fileName} ${definitionRange.startLine}:-${definitionRange.endLine}:]`,
            content: definitionRange.content
          });
        }
      } else if (options.includeLine || options['include-line']) {
        results.push({
          location: `[${fileName} ${match.line}:-${match.line}:]`,
          content: match.fullLine.trim()
        });
      } else if (options.previewLine || options['preview-line']) {
        results.push({
          location: `[${fileName} ${match.line}:${match.column}-${match.endLine}:${match.endColumn}]`,
          content: match.fullLine.trim()
        });
      } else {
        results.push({
          location: `[${fileName} ${match.line}:${match.column}-${match.endLine}:${match.endColumn}]`,
          content: match.text
        });
      }
    }

    return results;
  }

  private findDefinitionRange(match: SelectMatch, file: string): { startLine: number; endLine: number; content: string } | null {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    const matchLine = match.line - 1; // Convert to 0-based
    
    // Simple heuristic: if the match is part of a function declaration, find the entire function
    const currentLine = lines[matchLine];
    
    if (currentLine.includes('function ') || currentLine.includes('const ') || currentLine.includes('let ') || currentLine.includes('var ')) {
      // Find the start of the definition
      let startLine = matchLine;
      
      // Find the end by looking for the closing brace
      let endLine = matchLine;
      let braceCount = 0;
      let foundOpenBrace = false;
      
      for (let i = matchLine; i < lines.length; i++) {
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
      
      const definitionContent = lines.slice(startLine, endLine + 1).join('\n');
      
      return {
        startLine: startLine + 1, // Convert back to 1-based
        endLine: endLine + 1,
        content: definitionContent
      };
    }
    
    return null;
  }

  private outputResults(results: SelectResult[]): void {
    for (const result of results) {
      if (result.content && result.context) {
        // Preview mode: show location and content, then context
        console.log(`${result.location} ${result.content}`);
        console.log(`Context: ${result.context}`);
      } else if (result.content && result.location.includes(':-') && result.location.includes(':')) {
        // Check if this is include-definition mode (multi-line) vs include-line mode (single line)
        const hasMultiLineRange = result.location.match(/(\d+):-(\d+):/);
        if (hasMultiLineRange && hasMultiLineRange[1] !== hasMultiLineRange[2]) {
          // Multi-line content: show location, then content, then location again
          console.log(result.location);
          console.log(result.content);
          console.log(result.location);
        } else {
          // Single line with content: show location and content on same line
          console.log(`${result.location} ${result.content}`);
        }
      } else if (result.content) {
        // Single line with content: show location and content on same line
        console.log(`${result.location} ${result.content}`);
      } else {
        // Just location
        console.log(result.location);
      }
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