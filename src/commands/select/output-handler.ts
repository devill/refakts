import { SelectResult } from './select-types';

export class SelectOutputHandler {
  outputResults(results: SelectResult[]): void {
    for (const result of results) {
      this.outputSingleResult(result);
    }
  }

  private outputSingleResult(result: SelectResult): void {
    if (result.content && result.context) {
      this.outputPreviewResult(result);
    } else if (this.isMultiLineResult(result)) {
      this.outputMultiLineResult(result);
    } else if (result.content) {
      console.log(`${result.location} ${result.content}`);
    } else {
      console.log(result.location);
    }
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