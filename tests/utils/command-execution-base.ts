import { RefactoringCommand } from '../../src/core/commands/command';
import { ConsoleCapture } from './console-capture';

export abstract class CommandExecutionBase {
  protected command: RefactoringCommand;
  protected file: string;
  protected options: any;
  protected commandString: string;

  constructor(
    _command: RefactoringCommand,
    _file: string,
    _options: any,
    _commandString: string
  ) {
    this.command = _command;
    this.file = _file;
    this.options = _options;
    this.commandString = _commandString;
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