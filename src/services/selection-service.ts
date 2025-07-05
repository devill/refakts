import { SourceFile } from 'ts-morph';
import { ASTService } from './ast-service';
import { ContextAnalyzer } from './context-analyzer';
import { SelectResult } from '../types/selection-types';
import { RangeAnalyzer } from './range-analyzer';
import { BoundaryAnalyzer } from './boundary-analyzer';
import { StructuralAnalyzer } from './structural-analyzer';
import { RegexPatternMatcher } from './regex-pattern-matcher';

type SelectionOptions = Record<string, unknown>;

export class SelectionService {
  constructor(
    private _astService: ASTService,
    private _contextAnalyzer: ContextAnalyzer,
    private _rangeAnalyzer: RangeAnalyzer,
    private _boundaryAnalyzer: BoundaryAnalyzer,
    private _structuralAnalyzer: StructuralAnalyzer,
    private _regexMatcher: RegexPatternMatcher
  ) {}

  async findSelections(sourceFile: SourceFile, options: SelectionOptions): Promise<SelectResult[]> {
    const selectionType = this.determineSelectionType(options);
    return this.executeSelection(sourceFile, options, selectionType);
  }

  private determineSelectionType(options: SelectionOptions): string {
    if (options.range) return 'range';
    if (options.structural) return 'structural';
    if (options.boundaries) return 'boundaries';
    return 'regex';
  }

  private executeSelection(sourceFile: SourceFile, options: SelectionOptions, type: string): Promise<SelectResult[]> {
    const handlers: Record<string, () => SelectResult[]> = {
      range: () => this.rangeAnalyzer.findRangeMatches(sourceFile, options),
      structural: () => this.structuralAnalyzer.findStructuralMatches(sourceFile, options),
      boundaries: () => this.boundaryAnalyzer.findBoundaryMatches(sourceFile, options),
      regex: () => this.regexMatcher.findRegexMatches(sourceFile, options)
    };
    
    return Promise.resolve(handlers[type]());
  }
}