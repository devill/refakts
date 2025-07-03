import { SourceFile, Node, SyntaxKind } from 'ts-morph';
import { SelectResult } from '../commands/select/select-types';
import * as path from 'path';

export class RangeAnalyzer {
  findRangeMatches(sourceFile: SourceFile, options: Record<string, any>): SelectResult[] {
    const startRegex = options.startRegex || options['start-regex'];
    const endRegex = options.endRegex || options['end-regex'];
    const fileName = path.basename(sourceFile.getFilePath());
    
    const ranges = this.findContentRanges(sourceFile, startRegex, endRegex);
    
    if (ranges.length === 0) {
      return [{ location: 'No Matches' }];
    }
    
    return ranges.map(range => ({
      location: `\n[${fileName} ${range.startLine}:${range.startColumn}-${range.endLine}:${range.endColumn}]`,
      content: `${range.content}\n[${fileName} ${range.startLine}:${range.startColumn}-${range.endLine}:${range.endColumn}]`
    }));
  }

  private findContentRanges(sourceFile: SourceFile, startRegex: string, endRegex: string): any[] {
    const content = sourceFile.getFullText();
    const lines = content.split('\n');
    const ranges = [];
    const startPattern = new RegExp(startRegex);
    const endPattern = new RegExp(endRegex);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (this.isCommentLine(sourceFile, i + 1)) {
        continue;
      }
      
      const startMatch = startPattern.exec(line);
      if (startMatch) {
        const rangeStart = { line: i + 1, column: startMatch.index + 1 };
        
        for (let j = i; j < lines.length; j++) {
          const endLine = lines[j];
          
          if (this.isCommentLine(sourceFile, j + 1)) {
            continue;
          }
          
          const endMatch = endPattern.exec(endLine);
          if (endMatch) {
            const rangeEnd = { line: j + 1, column: endMatch.index + endMatch[0].length + 1 };
            const contentLines = lines.slice(i, j + 1);
            
            ranges.push({
              startLine: rangeStart.line,
              startColumn: rangeStart.column,
              endLine: rangeEnd.line,
              endColumn: rangeEnd.column,
              content: contentLines.join('\n')
            });
            
            i = j;
            break;
          }
        }
      }
    }
    
    return ranges;
  }

  private isCommentLine(sourceFile: SourceFile, lineNumber: number): boolean {
    // Simple approach: check if line content starts with comment markers
    const content = sourceFile.getFullText();
    const lines = content.split('\n');
    if (lineNumber <= 0 || lineNumber > lines.length) {
      return false;
    }
    
    const line = lines[lineNumber - 1];
    const trimmedLine = line.trim();
    return trimmedLine.startsWith('//') || trimmedLine.startsWith('*') || trimmedLine.startsWith('/*');
  }
}