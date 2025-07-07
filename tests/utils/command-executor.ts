import { CommandRegistry } from '../../src/command-registry';
import * as fs from 'fs';
import * as path from 'path';
import { CommandLineParser } from './command-line-parser';
import { ConsoleCapture } from './console-capture';
import { CliExecutor } from './cli-executor';
import { CommandExecutionBuilder } from './builders/command-execution-builder';

export interface CommandExecutorOptions {
  useCli?: boolean; // If true, uses CLI subprocess. If false, calls commands directly
}

export class CommandExecutor {
  private commandRegistry = new CommandRegistry();
  private useCli: boolean;
  private parser = new CommandLineParser();
  private consoleCapture = new ConsoleCapture();
  private cliExecutor = new CliExecutor();

  constructor(options: CommandExecutorOptions = {}) {
    this.useCli = options.useCli ?? process.env.REFAKTS_TEST_CLI === 'true';
  }

  isUsingCli(): boolean {
    return this.useCli;
  }

  async executeCommand(commandString: string, cwd: string = process.cwd()): Promise<string | void> {
    if (this.useCli) {
      return this.cliExecutor.executeCommand(commandString, cwd);
    } else {
      return this.executeDirect(commandString);
    }
  }


  private async executeDirect(commandString: string): Promise<string | void> {
    const { commandName, file, options } = this.parser.parseCommand(commandString);
    const command = this.findCommand(commandName);
    
    return this.buildAndExecuteCommand(command, file, options, commandName, commandString);
  }

  private buildAndExecuteCommand(command: any, file: string, options: any, commandName: string, commandString: string): Promise<string | void> {
    return CommandExecutionBuilder.create()
      .withCommand(command)
      .withFile(file)
      .withOptions(options)
      .withCommandName(commandName)
      .withCommandString(commandString)
      .execute(this.consoleCapture);
  }

  private findCommand(commandName: string) {
    const command = this.commandRegistry.getAllCommands()
      .find(cmd => cmd.name === commandName);
    
    if (!command) {
      throw new Error(`Unknown command: ${commandName}`);
    }
    
    return command;
  }

  private handleExecutionError(commandString: string, error: unknown): never {
    throw new Error(`Command execution failed: ${commandString}\n${(error as Error).message}`);
  }




  private loadCommandOptions(commandName: string): any[] {
    const optionsPath = path.join(__dirname, '..', '..', 'src', 'commands', `${commandName}-options.json`);
    try {
      const optionsData = fs.readFileSync(optionsPath, 'utf8');
      return JSON.parse(optionsData);
    } catch {
      return [];
    }
  }
}