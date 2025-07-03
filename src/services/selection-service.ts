import { SourceFile, Node } from 'ts-morph';
import { ASTService } from './ast-service';
import { ContextAnalyzer } from './context-analyzer';
import { SelectResult } from '../commands/select/select-types';
import { RangeAnalyzer } from './range-analyzer';
import { BoundaryAnalyzer } from './boundary-analyzer';
import { StructuralAnalyzer } from './structural-analyzer';
import { RegexPatternMatcher } from './regex-pattern-matcher';

export class SelectionService {
  constructor(
    private astService: ASTService,
    private contextAnalyzer: ContextAnalyzer,
    private rangeAnalyzer: RangeAnalyzer,
    private boundaryAnalyzer: BoundaryAnalyzer,
    private structuralAnalyzer: StructuralAnalyzer,
    private regexMatcher: RegexPatternMatcher
  ) {}

  async findSelections(sourceFile: SourceFile, options: Record<string, any>): Promise<SelectResult[]> {
    if (options.range) {
      return this.rangeAnalyzer.findRangeMatches(sourceFile, options);
    }
    
    if (options.structural) {
      return this.structuralAnalyzer.findStructuralMatches(sourceFile, options);
    }
    
    if (options.boundaries) {
      return this.boundaryAnalyzer.findBoundaryMatches(sourceFile, options);
    }
    
    return this.regexMatcher.findRegexMatches(sourceFile, options);
  }
}