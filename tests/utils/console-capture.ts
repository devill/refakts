import {ConsoleOutput} from '../../src/command-line-parser/output-formatter/console-output';

export class ConsoleCapture implements ConsoleOutput {
  private output: string[] = [];

  async captureOutput(executeFn: () => Promise<void>): Promise<string> {
    this.output = [];
    await executeFn();
    return this.getFormattedOutput();
  }

  private getFormattedOutput(): string {
    return this.output.join('').trim();
  }

  log(message: string): void {
    this.output.push(message + '\n');
  }

  error(message: string): void {
    this.output.push(message + '\n');
  }

  write(data: string): void {
    this.output.push(data);
  }
}