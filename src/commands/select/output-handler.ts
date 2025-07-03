import { SelectResult } from './select-types';

export class SelectOutputHandler {
  outputResults(results: SelectResult[]): void {
    if (results.length === 0) {
      console.log('No Matches');
      return;
    }
    
    for (const result of results) {
      this.outputSingleResult(result);
    }
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
      withContent: () => console.log(`${result.location} ${result.content}`),
      locationOnly: () => console.log(result.location)
    };
  }

  private outputPreviewResult(result: SelectResult): void {
    console.log(`${result.location} ${result.content}`);
    console.log(`Context: ${result.context}`);
  }

  private isMultiLineResult(result: SelectResult): boolean {
    if (!result.content || !result.location.includes(':-') || !result.location.includes(':')) {
      return false;
    }
    const hasMultiLineRange = result.location.match(/(\d+):-(\d+):/);
    return hasMultiLineRange ? hasMultiLineRange[1] !== hasMultiLineRange[2] : false;
  }

  private outputMultiLineResult(result: SelectResult): void {
    console.log(result.location);
    console.log(result.content);
    console.log(result.location);
  }
}