import {CommandRegistry} from '../../src/core/commands/command-registry';
import {CommandLineParser} from './command-line-parser';
import {ConsoleCapture} from './console-capture';
import {CliExecutor} from './cli-executor';
import {ExecutionContext} from './execution-context';
import {DirectoryUtils} from '../../src/utils/directory-utils';

export interface CommandExecutorOptions {
  useCli?: boolean; // If true, uses CLI subprocess. If false, calls commands directly
}

export interface CommandExecutionContext {
  command: any;
  file: string;
  options: any;
  commandName: string;
  commandString: string;
}

export class CommandExecutor {
  private commandRegistry: CommandRegistry;
  private useCli: boolean;
  private parser = new CommandLineParser();
  private consoleCapture = new ConsoleCapture();
  private cliExecutor = new CliExecutor();

  constructor(options: CommandExecutorOptions = {}) {
    this.useCli = options.useCli ?? process.env.REFAKTS_TEST_CLI === 'true';
    this.commandRegistry = new CommandRegistry(this.consoleCapture, true);
  }

  isUsingCli(): boolean {
    return this.useCli;
  }

  async executeCommand(commandString: string, cwd: string = process.cwd()): Promise<string | void> {
    if (this.useCli) {
      return this.cliExecutor.executeCommand(commandString, cwd);
    } else {
      return this.executeDirect(commandString, cwd);
    }
  }

  private async executeDirect(commandString: string, cwd: string): Promise<string | void> {
    return DirectoryUtils.withRootDirectory(cwd, async () => {
      return new ExecutionContext(this.executionContextFor(commandString))
          .execute(this.consoleCapture);
    });
  }

  private executionContextFor(commandString: string) {
    const parsedCommand = this.parser.parseCommand(commandString);
    return {
      command: this.findCommand(parsedCommand.commandName),
      ...parsedCommand
    };
  }

  private findCommand(commandName: string) {
    const command = this.commandRegistry.getAllCommands()
      .find(cmd => cmd.name === commandName);
    
    if (!command) {
      throw new Error(`Unknown command: ${commandName}`);
    }
    
    return command;
  }
}