export class ConsoleCapture {
  async captureOutput(executeFn: () => Promise<void>): Promise<string> {
    const { originalLog, output } = this.setupCapture();
    
    try {
      await executeFn();
      return this.getFormattedOutput(output.value);
    } finally {
      console.log = originalLog;
    }
  }

  private setupCapture() {
    const originalLog = console.log;
    const output = { value: '' };
    console.log = (...args: any[]) => { output.value += args.join(' ') + '\n'; };
    return { originalLog, output };
  }

  private getFormattedOutput(output: string): string {
    return output.trim();
  }
}