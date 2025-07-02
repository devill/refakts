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
    
    const command = this.commandRegistry.getAllCommands()
      .find(cmd => cmd.name === commandName);
    
    if (!command) {
      throw new Error(`Unknown command: ${commandName}`);
    }

    try {
      command.validateOptions(options);
      
      // Check if this is a locator command that outputs to console
      if (this.isLocatorCommand(commandName)) {
        return this.captureConsoleOutput(() => command.execute(file, options));
      } else {
        await command.execute(file, options);
        return;
      }
    } catch (error) {
      throw new Error(`Command execution failed: ${commandString}\n${(error as Error).message}`);
    }
  }

  private isLocatorCommand(commandName: string): boolean {
    return commandName.includes('locator');
  }

  private async captureConsoleOutput(executeFn: () => Promise<void>): Promise<string> {
    const originalLog = console.log;
    let capturedOutput = '';
    
    console.log = (...args: any[]) => {
      capturedOutput += args.join(' ') + '\n';
    };
    
    try {
      await executeFn();
      return capturedOutput.trim();
    } finally {
      console.log = originalLog;
    }
  }

  private parseCommand(commandString: string): { commandName: string; file: string; options: any } {
    const args = this.parseCommandLineArgs(commandString.trim());
    
    if (args.length < 2) {
      throw new Error(`Invalid command format: ${commandString}`);
    }

    const commandName = args[0];
    const file = args[1];
    const options: any = {};

    // Parse options like --line 5 --column 10
    for (let i = 2; i < args.length; i++) {
      const arg = args[i];
      
      if (arg.startsWith('--')) {
        const optionName = arg.slice(2); // Remove '--'
        
        // Check if this is a boolean flag (no value follows) or has a value
        const nextArg = args[i + 1];
        if (!nextArg || nextArg.startsWith('--')) {
          // Boolean flag
          options[optionName] = true;
        } else {
          // Flag with value
          const value = nextArg;
          
          // Try to parse as number, otherwise keep as string
          const numValue = Number(value);
          options[optionName] = isNaN(numValue) ? value : numValue;
          i++; // Skip the value argument
        }
      }
    }

    return { commandName, file, options };
  }

  private parseCommandLineArgs(commandString: string): string[] {
    const args: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < commandString.length; i++) {
      const char = commandString[i];

      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = '';
      } else if (char === ' ' && !inQuotes) {
        if (current.length > 0) {
          args.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }

    if (current.length > 0) {
      args.push(current);
    }

    return args;
  }

  private loadCommandOptions(commandName: string): any[] {
    const optionsPath = path.join(__dirname, '..', '..', 'src', 'commands', `${commandName}-options.json`);
    try {
      const optionsData = fs.readFileSync(optionsPath, 'utf8');
      return JSON.parse(optionsData);
    } catch (error) {
      return [];
    }
  }
}