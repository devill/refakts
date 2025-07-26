import {exec} from "child_process";

import {promisify} from "util";

export class CliExecutor {
  async executeCommand(commandString: string, cwd: string): Promise<string> {
    try {
      const { stdout } = await this.createExecAsync()(this.buildFullCommand(commandString), { cwd });
      return stdout;
    } catch (error) {
      throw this.createCommandError(this.buildFullCommand(commandString), error);
    }
  }

  private buildFullCommand(commandString: string): string {
    return `npm run dev -- ${commandString}`;
  }

  private createCommandError(fullCommand: string, error: any): Error {
    return new Error(`CLI command failed: ${fullCommand}\n${error}`);
  }

  private createExecAsync() {
    return promisify(exec);
  }
}