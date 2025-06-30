import { RefactoringCommand } from './command';
import { InlineVariableCommand } from './inline-variable-command';
import { RenameCommand } from './rename-command';

export class CommandRegistry {
  private commands = new Map<string, RefactoringCommand>();

  constructor() {
    this.registerDefaultCommands();
  }

  private registerDefaultCommands(): void {
    this.commands.set('inline-variable', new InlineVariableCommand());
    this.commands.set('rename', new RenameCommand());
  }

  register(name: string, command: RefactoringCommand): void {
    this.commands.set(name, command);
  }

  get(name: string): RefactoringCommand | undefined {
    return this.commands.get(name);
  }

  getAvailableCommands(): string[] {
    return Array.from(this.commands.keys());
  }
}