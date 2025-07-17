import { SelectResult } from '../../types/selection-types';
import { ConsoleOutput } from '../../interfaces/ConsoleOutput';

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
    return this.isMultiLineResult(currentResult) || this.isMultiLineResult(nextResult);
  }

  private outputSingleResult(result: SelectResult): void {
    const outputType = this.determineOutputType(result);
    this.executeOutput(result, outputType);
  }

  private determineOutputType(result: SelectResult): string {
    const typeChecks = [
      { check: this.hasPreviewContent(result), type: 'preview' },
      { check: this.isMultiLineResult(result), type: 'multiline' },
      { check: !!result.content, type: 'withContent' }
    ];
    
    const found = typeChecks.find(check => check.check);
    return found ? found.type : 'locationOnly';
  }

  private hasPreviewContent(result: SelectResult): boolean {
    return !!(result.content && result.context);
  }

  private executeOutput(result: SelectResult, outputType: string): void {
    const outputHandlers = this.getOutputHandlers(result);
    const handler = outputHandlers[outputType];
    if (handler) {
      handler();
    }
  }

  private getOutputHandlers(result: SelectResult): Record<string, () => void> {
    return {
      preview: () => this.outputPreviewResult(result),
      multiline: () => this.outputMultiLineResult(result),
      withContent: () => this.consoleOutput.log(`${result.location} ${result.content}`),
      locationOnly: () => this.consoleOutput.log(result.location)
    };
  }

  private outputPreviewResult(result: SelectResult): void {
    this.consoleOutput.log(`${result.location} ${result.context}`);
  }

  private isMultiLineResult(result: SelectResult): boolean {
    if (!result.content || !result.location.includes(':-') || !result.location.includes(':')) {
      return false;
    }
    const hasMultiLineRange = result.location.match(/(\d+):-(\d+):/);
    return hasMultiLineRange ? hasMultiLineRange[1] !== hasMultiLineRange[2] : false;
  }

  private outputMultiLineResult(result: SelectResult): void {
    this.consoleOutput.log(result.location);
    this.consoleOutput.log(result.content || '');
    this.consoleOutput.log(result.location);
  }
}