import * as fs from 'fs';
import { SelectMatch, DefinitionRange } from './select-types';

export class DefinitionRangeDetector {
  findDefinitionRange(match: SelectMatch, file: string): DefinitionRange | null {
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
      endLine = this.processLineForBraces(line, braceCount, foundOpenBrace, i);
      
      const braceResult = this.countBraces(line, braceCount, foundOpenBrace);
      braceCount = braceResult.braceCount;
      foundOpenBrace = braceResult.foundOpenBrace;
      
      if (foundOpenBrace && braceCount === 0) {
        break;
      }
    }
    
    return endLine;
  }

  private processLineForBraces(line: string, braceCount: number, foundOpenBrace: boolean, lineIndex: number): number {
    let currentBraceCount = braceCount;
    let currentFoundOpenBrace = foundOpenBrace;
    
    for (const char of line) {
      if (char === '{') {
        currentBraceCount++;
        currentFoundOpenBrace = true;
      } else if (char === '}') {
        currentBraceCount--;
        if (currentFoundOpenBrace && currentBraceCount === 0) {
          return lineIndex;
        }
      }
    }
    
    return lineIndex;
  }

  private countBraces(line: string, initialBraceCount: number, initialFoundOpenBrace: boolean): { braceCount: number; foundOpenBrace: boolean } {
    let braceCount = initialBraceCount;
    let foundOpenBrace = initialFoundOpenBrace;
    
    for (const char of line) {
      if (char === '{') {
        braceCount++;
        foundOpenBrace = true;
      } else if (char === '}') {
        braceCount--;
      }
    }
    
    return { braceCount, foundOpenBrace };
  }
}