import { ConsoleCapture } from '../console-capture';

/**
 * Builder for command execution with validation and error handling.
 * Reduces parameter count by encapsulating command execution logic.
 */
export class CommandExecutionBuilder {
  private command: any;
  private file: string = '';
  private options: any = {};
  private commandName: string = '';
  private commandString: string = '';

  /**
   * Sets the command to execute.
   */
  withCommand(command: any): CommandExecutionBuilder {
    this.command = command;
    return this;
  }

  /**
   * Sets the file parameter.
   */
  withFile(file: string): CommandExecutionBuilder {
    this.file = file;
    return this;
  }

  /**
   * Sets the options parameter.
   */
  withOptions(options: any): CommandExecutionBuilder {
    this.options = options;
    return this;
  }

  /**
   * Sets the command name.
   */
  withCommandName(commandName: string): CommandExecutionBuilder {
    this.commandName = commandName;
    return this;
  }

  /**
   * Sets the command string for error reporting.
   */
  withCommandString(commandString: string): CommandExecutionBuilder {
    this.commandString = commandString;
    return this;
  }

  /**
   * Executes the command with validation and error handling.
   */
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

  /**
   * Creates a new builder instance.
   */
  static create(): CommandExecutionBuilder {
    return new CommandExecutionBuilder();
  }
}