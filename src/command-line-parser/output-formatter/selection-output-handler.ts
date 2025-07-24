import { SelectResult } from '../../core/services/selection/selection-types';
import { ConsoleOutput } from './console-output';

export class SelectOutputHandler {
  private consoleOutput: ConsoleOutput;
  
  constructor(consoleOutput: ConsoleOutput) {
    this.consoleOutput = consoleOutput;
  }

  outputResults(results: SelectResult[]): void {
    if (this.hasNoResults(results)) {
      this.consoleOutput.log('No Matches');
      return;
    }
    
    this.processAllResults(results);
  }

  private hasNoResults(results: SelectResult[]): boolean {
    return results.length === 0;
  }

  private processAllResults(results: SelectResult[]): void {
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      this.outputSingleResult(result);
      this.addSpacingIfNeeded(results, i);
    }
  }

  private addSpacingIfNeeded(results: SelectResult[], index: number): void {
    if (index < results.length - 1) {
      const currentResult = results[index];
      const nextResult = results[index + 1];
      if (this.needsSpacing(currentResult, nextResult)) {
        this.consoleOutput.log('');
      }
    }
  }

  private needsSpacing(currentResult: SelectResult, nextResult: SelectResult): boolean {
    return currentResult.isMultiLineResult() || nextResult.isMultiLineResult();
  }

  private outputSingleResult(result: SelectResult): void {
    this.consoleOutput.log(result.toString());
  }
}