export class ConsoleCapture {
  async captureOutput(executeFn: () => Promise<void>): Promise<string> {
    const { originalLog, originalWrite, output } = this.setupCapture();
    
    try {
      await executeFn();
      return this.getFormattedOutput(output.value);
    } finally {
      console.log = originalLog;
      process.stdout.write = originalWrite;
    }
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
}