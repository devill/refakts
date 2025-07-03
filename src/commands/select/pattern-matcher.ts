import { SelectMatch } from './select-types';

export class SelectPatternMatcher {
  findMatches(content: string, pattern: RegExp): SelectMatch[] {
    const lines = content.split('\n');
    return this.findRegexMatches(lines, pattern);
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
    return {
      line: lineIndex + 1,
      column: match.index + 1,
      endLine: lineIndex + 1,
      endColumn: match.index + match[0].length + 1,
      text: match[0],
      fullLine: line
    };
  }
}