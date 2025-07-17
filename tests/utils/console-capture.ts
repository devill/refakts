import {ConsoleOutput} from '../../src/interfaces/ConsoleOutput';

export class ConsoleCapture implements ConsoleOutput {
  async captureOutput(executeFn: () => Promise<void>): Promise<string> {
    const captureState = this.setupCapture();
    
    try {
      await executeFn();
      return this.getFormattedOutput(captureState.output.value);
    } finally {
      this.restoreOriginals(captureState);
    }
  }

  private restoreOriginals(captureState: any): void {
    console.log = captureState.originalLog;
    process.stdout.write = captureState.originalWrite;
  }

  private setupCapture() {
    const originalLog = console.log;
    const originalWrite = process.stdout.write;
    const output = { value: '' };

    console.log = (...args: any[]) => { output.value += args.join(' ') + '\n'; };
    process.stdout.write = (str: string) => {output.value += str; return true; };

    return { originalLog, originalWrite, output };
  }

  private getFormattedOutput(output: string): string {
    return output.trim();
  }

  // ConsoleOutput interface implementation
  log(message: string): void {
    console.log(message);
  }

  error(message: string): void {
    console.error(message);
  }

  write(data: string): void {
    process.stdout.write(data);
  }
}