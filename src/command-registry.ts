import { RefactoringCommand } from './command';
import { ExtractVariableCommand } from './commands/extract-variable-command';
import { InlineVariableCommand } from './commands/inline-variable-command';
import { RenameCommand } from './commands/rename-command';
import { SelectCommand } from './commands/select-command';
import { VariableLocatorCommand } from './commands/variable-locator-command';

const loadCommands = (): RefactoringCommand[] => [
  new ExtractVariableCommand(),
  new InlineVariableCommand(),
  new RenameCommand(),
  new SelectCommand(),
  new VariableLocatorCommand()
];

export class CommandRegistry {
  private commands = new Map<string, RefactoringCommand>();

  constructor() {
    this.registerCommands();
  }

  private registerCommands(): void {
    const commands = loadCommands();
    for (const command of commands) {
      this.commands.set(command.name, command);
    }
  }

  getAllCommands(): RefactoringCommand[] {
    return Array.from(this.commands.values());
  }
}