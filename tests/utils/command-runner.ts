import { CommandExecutor } from './command-executor';

export class CommandRunner {
  private commandExecutor: CommandExecutor;

  constructor(commandExecutor: CommandExecutor) {
    this.commandExecutor = commandExecutor;
  }

  async runCommand(command: string, cwd: string = process.cwd()): Promise<{ stdout: string; stderr: string; success: boolean }> {
    try {
      const output = await this.commandExecutor.executeCommand(command, cwd);
      return { stdout: typeof output === 'string' ? output : '', stderr: '', success: true };
    } catch (error) {
      return { stdout: '', stderr: (error as Error).message, success: false };
    }
  }
}