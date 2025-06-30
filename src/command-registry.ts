import { RefactoringCommand } from './command';
import * as fs from 'fs';
import * as path from 'path';

export class CommandRegistry {
  private commands = new Map<string, RefactoringCommand>();

  constructor() {
    this.scanAndRegisterCommands();
  }

  private scanAndRegisterCommands(): void {
    const commandsDir = path.join(__dirname, 'commands');
    
    if (!fs.existsSync(commandsDir)) {
      return;
    }

    const commandFiles = this.getCommandFiles(commandsDir);
    for (const file of commandFiles) {
      this.loadCommand(commandsDir, file);
    }
  }

  private getCommandFiles(commandsDir: string): string[] {
    return fs.readdirSync(commandsDir)
      .filter(file => file.endsWith('.ts') || file.endsWith('.js'))
      .filter(file => !file.endsWith('.d.ts'));
  }

  private loadCommand(commandsDir: string, file: string): void {
    try {
      const commandPath = path.join(commandsDir, file);
      const commandModule = require(commandPath);
      this.registerCommandFromModule(commandModule);
    } catch (error) {
      console.warn(`Failed to load command from ${file}:`, error);
    }
  }

  private registerCommandFromModule(commandModule: any): void {
    const commandClass = this.findCommandClass(commandModule);
    if (commandClass) {
      const command = new commandClass();
      this.commands.set(command.name, command);
    }
  }

  private findCommandClass(commandModule: any): any {
    for (const exportName in commandModule) {
      const exportValue = commandModule[exportName];
      if (this.isValidCommandClass(exportValue)) {
        return exportValue;
      }
    }
    return null;
  }

  private isValidCommandClass(exportValue: any): boolean {
    return typeof exportValue === 'function' && 
           exportValue.prototype && 
           'execute' in exportValue.prototype;
  }


  getAllCommands(): RefactoringCommand[] {
    return Array.from(this.commands.values());
  }
}