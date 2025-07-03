import { RefactoringCommand } from '../command';
import { SelectResult } from './select/select-types';
import { SelectOutputHandler } from './select/output-handler';
import { SelectionService } from '../services/selection-service';
import { ASTService } from '../services/ast-service';
import { ContextAnalyzer } from '../services/context-analyzer';
import { RangeAnalyzer } from '../services/range-analyzer';
import { BoundaryAnalyzer } from '../services/boundary-analyzer';
import { StructuralAnalyzer } from '../services/structural-analyzer';
import { RegexPatternMatcher } from '../services/regex-pattern-matcher';

export class SelectCommand implements RefactoringCommand {
  readonly name = 'select';
  readonly description = 'Find code elements and return their locations with content preview';
  readonly complete = true;

  private selectionService: SelectionService;
  private astService: ASTService;
  private outputHandler = new SelectOutputHandler();

  constructor() {
    this.astService = new ASTService();
    const contextAnalyzer = new ContextAnalyzer();
    const rangeAnalyzer = new RangeAnalyzer();
    const boundaryAnalyzer = new BoundaryAnalyzer();
    const structuralAnalyzer = new StructuralAnalyzer();
    const regexMatcher = new RegexPatternMatcher();
    
    this.selectionService = new SelectionService(
      this.astService,
      contextAnalyzer,
      rangeAnalyzer,
      boundaryAnalyzer,
      structuralAnalyzer,
      regexMatcher
    );
  }

  async execute(file: string, options: Record<string, any>): Promise<void> {
    this.validateOptions(options);
    
    try {
      const sourceFile = this.astService.loadSourceFile(file);
      const results = await this.selectionService.findSelections(sourceFile, options);
      this.outputHandler.outputResults(results);
    } catch (error) {
      this.handleExecutionError(error);
    }
  }

  private handleExecutionError(error: unknown): void {
    console.error('Error:', error);
    process.exit(1);
  }

  validateOptions(options: Record<string, any>): void {
    if (options.range) {
      this.validateRangeOptions(options);
    } else if (options.structural) {
      this.validateStructuralOptions(options);
    } else if (!options.regex) {
      throw new Error('--regex must be specified');
    }
  }

  private validateRangeOptions(options: Record<string, any>): void {
    if (!options.startRegex && !options['start-regex']) {
      throw new Error('--start-regex must be specified with --range');
    }
    if (!options.endRegex && !options['end-regex']) {
      throw new Error('--end-regex must be specified with --range');
    }
  }

  private validateStructuralOptions(options: Record<string, any>): void {
    if (!options.regex) {
      throw new Error('--regex must be specified with --structural');
    }
  }

  getHelpText(): string {
    return '\nExamples:\n  refakts select src/file.ts --regex "tempResult"\n  refakts select src/file.ts --regex "calculateTotal" --include-definition\n  refakts select src/file.ts --regex "tempResult" --include-line\n  refakts select src/file.ts --regex "tempResult" --preview-line\n  refakts select src/file.ts --range --start-regex "const.*=" --end-regex "return.*"\n  refakts select src/file.ts --regex "user.*" --boundaries "function"\n  refakts select src/file.ts --structural --regex ".*[Uu]ser.*" --include-methods --include-fields';
  }
}