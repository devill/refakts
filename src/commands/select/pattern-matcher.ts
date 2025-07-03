import { SelectMatch } from './select-types';

export class SelectPatternMatcher {
  findMatches(content: string, pattern: RegExp): SelectMatch[] {
    const lines = content.split('\n');
    
    // Check if the pattern might be multiline (contains \s or \S)
    if (this.isMultilinePattern(pattern)) {
      return this.findMultilineMatches(content, pattern, lines);
    }
    
    return this.findRegexMatches(lines, pattern);
  }

  private isMultilinePattern(pattern: RegExp): boolean {
    return pattern.source.includes('\\s') || pattern.source.includes('\\S');
  }

  private findMultilineMatches(content: string, pattern: RegExp, lines: string[]): SelectMatch[] {
    const matches: SelectMatch[] = [];
    let match;
    
    while ((match = pattern.exec(content)) !== null) {
      const selectMatch = this.createMultilineMatch(match, content, lines);
      if (selectMatch && !this.isMatchInComment(selectMatch, content)) {
        matches.push(selectMatch);
      }
    }
    
    return matches;
  }

  private isMatchInComment(selectMatch: SelectMatch, content: string): boolean {
    // Check if the match starts within a comment block
    const beforeMatch = content.substring(0, this.getIndexFromLineColumn(content, selectMatch.line, selectMatch.column));
    const commentStartIndex = beforeMatch.lastIndexOf('/**');
    const commentEndIndex = beforeMatch.lastIndexOf('*/');
    
    // If there's a comment start after the last comment end, we're in a comment
    return commentStartIndex > commentEndIndex;
  }

  private getIndexFromLineColumn(content: string, line: number, column: number): number {
    const lines = content.split('\n');
    let index = 0;
    
    for (let i = 0; i < line - 1; i++) {
      index += lines[i].length + 1; // +1 for the newline character
    }
    
    return index + column - 1;
  }

  private createMultilineMatch(match: RegExpExecArray, content: string, lines: string[]): SelectMatch | null {
    const startIndex = match.index;
    const endIndex = match.index + match[0].length;
    
    // Convert character positions to line/column
    const startPos = this.getLineColumnFromIndex(content, startIndex);
    const endPos = this.getLineColumnFromIndex(content, endIndex);
    
    if (!startPos || !endPos) return null;
    
    const { textToUse, adjustedStartPos } = this.extractMultilineMatchDetails(match, startPos, content);
    
    return {
      line: adjustedStartPos.line,
      column: adjustedStartPos.column,
      endLine: endPos.line,
      endColumn: endPos.column,
      text: textToUse,
      fullLine: lines[adjustedStartPos.line - 1] || ''
    };
  }

  private getLineColumnFromIndex(content: string, index: number): { line: number; column: number } | null {
    const beforeIndex = content.substring(0, index);
    const lines = beforeIndex.split('\n');
    const line = lines.length;
    const column = lines[lines.length - 1].length + 1;
    return { line, column };
  }

  private extractMultilineMatchDetails(match: RegExpExecArray, startPos: { line: number; column: number }, content: string): { textToUse: string; adjustedStartPos: { line: number; column: number } } {
    const hasCapture = match.length > 1 && match[1] !== undefined;
    const textToUse = hasCapture ? match[1] : match[0];
    
    if (hasCapture) {
      const captureStart = match.index + match[0].indexOf(match[1]);
      const adjustedStartPos = this.getLineColumnFromIndex(content, captureStart);
      return { textToUse, adjustedStartPos: adjustedStartPos || startPos };
    }
    
    return { textToUse, adjustedStartPos: startPos };
  }

  private findRegexMatches(lines: string[], pattern: RegExp): SelectMatch[] {
    const matches: SelectMatch[] = [];
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      this.processLineForMatches(lines[lineIndex], lineIndex, pattern, matches);
    }
    
    return matches;
  }

  private processLineForMatches(line: string, lineIndex: number, pattern: RegExp, matches: SelectMatch[]): void {
    if (this.isCommentLine(line)) {
      return;
    }
    
    this.extractMatchesFromLine(line, lineIndex, pattern, matches);
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
    const { textToUse, startIndex } = this.extractMatchDetails(match);
    return this.buildSelectMatch(textToUse, startIndex, lineIndex, line);
  }

  private extractMatchDetails(match: RegExpExecArray): { textToUse: string; startIndex: number } {
    const hasCapture = match.length > 1 && match[1] !== undefined;
    const textToUse = hasCapture ? match[1] : match[0];
    const startIndex = hasCapture ? match.index + match[0].indexOf(match[1]) : match.index;
    return { textToUse, startIndex };
  }

  private buildSelectMatch(textToUse: string, startIndex: number, lineIndex: number, line: string): SelectMatch {
    return {
      line: lineIndex + 1,
      column: startIndex + 1,
      endLine: lineIndex + 1,
      endColumn: startIndex + textToUse.length + 1,
      text: textToUse,
      fullLine: line
    };
  }
}