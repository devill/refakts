export class ConsoleCapture {
  async captureOutput(executeFn: () => Promise<void>): Promise<string> {
    const originalLog = console.log;
    const output = { value: '' };
    
    console.log = (...args: any[]) => { output.value += args.join(' ') + '\n'; };
    
    try {
      await executeFn();
      return output.value.trim();
    } finally {
      console.log = originalLog;
    }
  }
}