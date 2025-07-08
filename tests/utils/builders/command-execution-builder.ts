import { ConsoleCapture } from '../console-capture';
import {CommandExecutionContext} from "../command-executor";

export class CommandExecutionBuilder {
  private command: any;
  private file = '';
  private options: any = {};
  private commandName = '';
  private commandString = '';

  withContext(context: CommandExecutionContext) {
    this.command = context.command;
    this.commandString = context.commandString;
    this.commandName = context.commandName;
    this.file = context.file;
    this.options = context.options;
    return this;
  }

  async execute(consoleCapture: ConsoleCapture): Promise<string | void> {
    try {
      this.command.validateOptions(this.options);
      return this.runValidatedCommand(consoleCapture);
    } catch (error) {
      this.handleExecutionError(error);
    }
  }

  private async runValidatedCommand(consoleCapture: ConsoleCapture): Promise<string | void> {
    if (this.isLocatorCommand()) {
      return consoleCapture.captureOutput(() => this.command.execute(this.file, this.options));
    } else {
      await this.command.execute(this.file, this.options);
      return;
    }
  }

  private isLocatorCommand(): boolean {
    return this.commandName.includes('locator') || this.commandName === 'select';
  }

  private handleExecutionError(error: unknown): never {
    throw new Error(`Command execution failed: ${this.commandString}\n${(error as Error).message}`);
  }

  static create(): CommandExecutionBuilder {
    return new CommandExecutionBuilder();
  }
}