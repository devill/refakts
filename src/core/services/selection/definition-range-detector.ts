import { SelectMatch, DefinitionRange } from '../../../types/selection-types';

export class DefinitionRangeDetector {
  findDefinitionRange(match: SelectMatch, file: string): DefinitionRange | null {
    const lines = file.split("\n");
    const matchLine = match.line - 1;
    
    if (!this.isDefinitionLine(lines[matchLine])) {
      return null;
    }
    
    return this.buildDefinitionRange(lines, matchLine);
  }

  private buildDefinitionRange(lines: string[], matchLine: number): DefinitionRange {
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
    const tracker = this.createBraceTracker(startLine);
    this.scanLinesForDefinitionEnd(lines, startLine, tracker);
    return tracker.endLine;
  }

  private processLineForEndDetection(line: string, tracker: { endLine: number; braceCount: number; foundOpenBrace: boolean }, lineIndex: number): void {
    this.processCharacters(line, tracker, lineIndex);
    this.setEndLine(tracker, lineIndex);
  }

  private processCharacters(line: string, tracker: { endLine: number; braceCount: number; foundOpenBrace: boolean }, lineIndex: number): void {
    for (const char of line) {
      this.updateBraceTracking(char, tracker);
      
      if (this.shouldStopProcessing(tracker)) {
        this.setEndLine(tracker, lineIndex);
        return;
      }
    }
  }

  private setEndLine(tracker: { endLine: number }, lineIndex: number): void {
    tracker.endLine = lineIndex;
  }

  private scanLinesForDefinitionEnd(lines: string[], startLine: number, tracker: { endLine: number; braceCount: number; foundOpenBrace: boolean }): void {
    for (let i = startLine; i < lines.length; i++) {
      this.processLineForEndDetection(lines[i], tracker, i);
      
      if (this.isDefinitionComplete(tracker)) {
        break;
      }
    }
  }

  private createBraceTracker(startLine: number): { endLine: number; braceCount: number; foundOpenBrace: boolean } {
    return { endLine: startLine, braceCount: 0, foundOpenBrace: false };
  }

  private shouldStopProcessing(tracker: { braceCount: number; foundOpenBrace: boolean }): boolean {
    return tracker.foundOpenBrace && tracker.braceCount === 0;
  }

  private isDefinitionComplete(tracker: { braceCount: number; foundOpenBrace: boolean }): boolean {
    return tracker.foundOpenBrace && tracker.braceCount === 0;
  }

  private updateBraceTracking(char: string, tracker: { braceCount: number; foundOpenBrace: boolean }): void {
    if (char === '{') {
      tracker.braceCount++;
      tracker.foundOpenBrace = true;
    } else if (char === '}') {
      tracker.braceCount--;
    }
  }
}