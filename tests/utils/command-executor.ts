import { CommandRegistry } from '../../src/command-registry';
import * as fs from 'fs';
import * as path from 'path';

export interface CommandExecutorOptions {
  useCli?: boolean; // If true, uses CLI subprocess. If false, calls commands directly
}

export class CommandExecutor {
  private commandRegistry = new CommandRegistry();
  private useCli: boolean;

  constructor(options: CommandExecutorOptions = {}) {
    this.useCli = options.useCli ?? process.env.REFAKTS_TEST_CLI === 'true';
  }

  isUsingCli(): boolean {
    return this.useCli;
  }

  async executeCommand(commandString: string, cwd: string = process.cwd()): Promise<string | void> {
    if (this.useCli) {
      return this.executeViaCli(commandString, cwd);
    } else {
      return this.executeDirect(commandString);
    }
  }

  private async executeViaCli(commandString: string, cwd: string): Promise<string> {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    const fullCommand = `npm run dev -- ${commandString}`;
    try {
      const { stdout } = await execAsync(fullCommand, { cwd });
      return stdout;
    } catch (error) {
      throw new Error(`CLI command failed: ${fullCommand}\n${error}`);
    }
  }

  private async executeDirect(commandString: string): Promise<string | void> {
    const { commandName, file, options } = this.parseCommand(commandString);
    const command = this.findCommand(commandName);
    
    return this.executeValidatedCommand(command, file, options, commandName, commandString);
  }

  private findCommand(commandName: string) {
    const command = this.commandRegistry.getAllCommands()
      .find(cmd => cmd.name === commandName);
    
    if (!command) {
      throw new Error(`Unknown command: ${commandName}`);
    }
    
    return command;
  }

  private async executeValidatedCommand(
    command: any, 
    file: string, 
    options: any, 
    commandName: string, 
    commandString: string
  ): Promise<string | void> {
    try {
      command.validateOptions(options);
      return this.runValidatedCommand(command, file, options, commandName);
    } catch (error) {
      throw new Error(`Command execution failed: ${commandString}\n${(error as Error).message}`);
    }
  }

  private async runValidatedCommand(command: any, file: string, options: any, commandName: string): Promise<string | void> {
    if (this.isLocatorCommand(commandName)) {
      return this.captureConsoleOutput(() => command.execute(file, options));
    } else {
      await command.execute(file, options);
      return;
    }
  }

  private isLocatorCommand(commandName: string): boolean {
    return commandName.includes('locator') || commandName === 'select';
  }

  private async captureConsoleOutput(executeFn: () => Promise<void>): Promise<string> {
    const originalLog = console.log;
    let capturedOutput = '';
    
    console.log = (...args: any[]) => { capturedOutput += args.join(' ') + '\n'; };
    
    try {
      await executeFn();
      return capturedOutput.trim();
    } finally {
      console.log = originalLog;
    }
  }

  private parseCommand(commandString: string): { commandName: string; file: string; options: any } {
    const args = this.parseCommandLineArgs(commandString.trim());
    this.validateCommandFormat(args, commandString);
    
    const startIndex = this.getCommandStartIndex(args);
    this.validateMinimumArgs(args, startIndex, commandString);
    
    return this.extractCommandComponents(args, startIndex);
  }

  private extractCommandComponents(args: string[], startIndex: number) {
    const commandName = args[startIndex];
    const target = args[startIndex + 1];
    const options: any = {};
    
    const file = this.extractFileFromTarget(target, options);
    this.parseCommandOptions(args, startIndex, options);
    
    return { commandName, file, options };
  }

  private validateCommandFormat(args: string[], commandString: string): void {
    if (args.length < 2) {
      throw new Error(`Invalid command format: ${commandString}`);
    }
  }

  private getCommandStartIndex(args: string[]): number {
    return args[0] === 'refakts' ? 1 : 0;
  }

  private validateMinimumArgs(args: string[], startIndex: number, commandString: string): void {
    if (args.length < startIndex + 2) {
      throw new Error(`Invalid command format: ${commandString}`);
    }
  }

  private extractFileFromTarget(target: string, options: any): string {
    if (target.startsWith('[') && target.endsWith(']')) {
      return this.parseLocationFormat(target, options);
    }
    return target;
  }

  private parseLocationFormat(target: string, options: any): string {
    const file = this.extractFileFromLocationTarget(target);
    this.addLocationToOptions(target, options);
    return file;
  }

  private extractFileFromLocationTarget(target: string): string {
    const locationMatch = target.match(/^\[([^\]]+)\s+/);
    if (!locationMatch) {
      throw new Error(`Invalid location format: ${target}`);
    }
    return locationMatch[1];
  }

  private addLocationToOptions(target: string, options: any): void {
    const locationRegex = /^\[([^\]]+)\s+(\d+):(\d+)-(\d+):(\d+)\]$/;
    const match = target.match(locationRegex);
    
    if (match) {
      options.location = this.createLocationObject(match);
    }
  }

  private createLocationObject(match: RegExpMatchArray) {
    return {
      file: match[1],
      startLine: parseInt(match[2], 10),
      startColumn: parseInt(match[3], 10),
      endLine: parseInt(match[4], 10),
      endColumn: parseInt(match[5], 10)
    };
  }

  private parseCommandOptions(args: string[], startIndex: number, options: any): void {
    for (let i = startIndex + 2; i < args.length; i++) {
      const arg = args[i];
      
      if (arg.startsWith('--')) {
        i = this.processOptionFlag(args, i, options);
      }
    }
  }

  private processOptionFlag(args: string[], index: number, options: any): number {
    const optionName = args[index].slice(2);
    const nextArg = args[index + 1];
    
    if (!nextArg || nextArg.startsWith('--')) {
      options[optionName] = true;
      return index;
    }
    
    this.setOptionValue(options, optionName, nextArg);
    return index + 1;
  }

  private setOptionValue(options: any, optionName: string, value: string): void {
    if (options[optionName] !== undefined) {
      this.addToExistingOption(options, optionName, value);
    } else {
      const numValue = Number(value);
      options[optionName] = isNaN(numValue) ? value : numValue;
    }
  }

  private addToExistingOption(options: any, optionName: string, value: string): void {
    if (!Array.isArray(options[optionName])) {
      options[optionName] = [options[optionName]];
    }
    options[optionName].push(value);
  }

  private parseCommandLineArgs(commandString: string): string[] {
    const args: string[] = [];
    const state = { current: '', inQuotes: false, quoteChar: '' };

    for (let i = 0; i < commandString.length; i++) {
      this.processCharacter(commandString[i], args, state);
    }

    this.addArgumentIfPresent(args, state.current);
    return args;
  }

  private processCharacter(char: string, args: string[], state: any): void {
    if (this.isQuoteStart(char, state.inQuotes)) {
      state.inQuotes = true;
      state.quoteChar = char;
    } else if (this.isQuoteEnd(char, state.inQuotes, state.quoteChar)) {
      state.inQuotes = false;
      state.quoteChar = '';
    } else if (this.isArgumentSeparator(char, state.inQuotes)) {
      state.current = this.addArgumentIfPresent(args, state.current);
    } else {
      state.current += char;
    }
  }

  private isQuoteStart(char: string, inQuotes: boolean): boolean {
    return (char === '"' || char === "'") && !inQuotes;
  }

  private isQuoteEnd(char: string, inQuotes: boolean, quoteChar: string): boolean {
    return char === quoteChar && inQuotes;
  }

  private isArgumentSeparator(char: string, inQuotes: boolean): boolean {
    return char === ' ' && !inQuotes;
  }

  private addArgumentIfPresent(args: string[], current: string): string {
    if (current.length > 0) {
      args.push(current);
      return '';
    }
    return current;
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