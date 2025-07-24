import { ConsoleOutput } from './console-output';

export class FakeConsole implements ConsoleOutput {
  private _output: string[] = [];

  log(message: string): void {
    this._output.push(message);
  }

  error(message: string): void {
    this._output.push(message);
  }

  write(data: string): void {
    this._output.push(data);
  }

  getOutput(): string {
    return this._output.join('');
  }

  clear(): void {
    this._output = [];
  }
}