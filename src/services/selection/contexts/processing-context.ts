import { SelectMatch } from '../../../core/services/selection/selection-types';
import { MatchContext } from '../../../command-line-parser/output-formatter/match-context';
import { MatchBuildContext } from '../../../command-line-parser/output-formatter/contexts/match-build-context';
import { MatchDetailsContext } from '../../../command-line-parser/output-formatter/contexts/match-details-context';

interface Position {
  line: number;
  column: number;
}

export class ProcessingContext {
  constructor(
    public _pattern: RegExp,
    public _content: string,
    public _context: MatchContext,
    public _matches: SelectMatch[]
  ) {}

  processAllMatches(): void {
    let match;
    while ((match = this._pattern.exec(this._content)) !== null) {
      const selectMatch = this.createMultilineMatch(match);
      if (selectMatch && !this._context.isMatchInComment(selectMatch)) {
        this._matches.push(selectMatch);
      }
    }
  }

  private createMultilineMatch(match: RegExpExecArray): SelectMatch | null {
    const positions = this.getMatchPositions(match);
    if (!positions) return null;
    
    const { textToUse, adjustedStartPos } = this.extractMultilineMatchDetails(match, positions.startPos);
    const buildContext = new MatchBuildContext(adjustedStartPos, positions.endPos, textToUse, this._context.lines);
    return buildContext.buildSelectMatch();
  }

  private getMatchPositions(match: RegExpExecArray) {
    return this._context.getMatchPositions(match);
  }

  private extractMultilineMatchDetails(match: RegExpExecArray, startPos: Position): { textToUse: string; adjustedStartPos: Position } {
    const detailsContext = new MatchDetailsContext(match, startPos, this._context);
    return detailsContext.extractDetails();
  }
}