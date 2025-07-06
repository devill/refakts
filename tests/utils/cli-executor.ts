export class CliExecutor {
  async executeCommand(commandString: string, cwd: string): Promise<string> {
    const execAsync = this.createExecAsync();
    const fullCommand = `npm run dev -- ${commandString}`;
    
    try {
      const { stdout } = await execAsync(fullCommand, { cwd });
      return stdout;
    } catch (error) {
      throw new Error(`CLI command failed: ${fullCommand}\n${error}`);
    }
  }

  private createExecAsync() {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    return promisify(exec);
  }
}