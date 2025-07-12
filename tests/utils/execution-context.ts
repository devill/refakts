import { ConsoleCapture } from './console-capture';
import {CommandExecutionContext} from "./command-executor";

export class ExecutionContext {
  private command: any;
  private file: string;
  private options: any;
  private commandName: string;
  private commandString: string;

  constructor(context: CommandExecutionContext) {
    this.command = context.command;
    this.commandString = context.commandString;
    this.commandName = context.commandName;
    this.file = context.file;
    this.options = context.options;
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
    return consoleCapture.captureOutput(() => this.command.execute(this.file, this.options));
  }

  private handleExecutionError(error: unknown): never {
    throw new Error(`Command execution failed: ${this.commandString}\n${(error as Error).message}`);
  }
}