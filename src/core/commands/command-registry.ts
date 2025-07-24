import { RefactoringCommand } from './command';
import { ExtractVariableCommand } from './extract-variable-command';
import { FindUsagesCommand } from './find-usages-command';
import { InlineVariableCommand } from './inline-variable-command';
import { MoveFileCommand } from './move-file-command';
import { MoveMethodCommand } from './move-method-command';
import { RenameCommand } from './rename-command';
import { SelectCommand } from './select-command';
import { SortMethodsCommand } from './sort-methods-command';
import { ConsoleOutput } from '../../command-line-parser/output-formatter/console-output';

const loadCommands = (): RefactoringCommand[] => [
  new ExtractVariableCommand(),
  new InlineVariableCommand(),
  new RenameCommand(),
  new SelectCommand(),
  new SortMethodsCommand(),
  new FindUsagesCommand(),
  new MoveMethodCommand(),
  new MoveFileCommand()
];

export class CommandRegistry {
  private commands = new Map<string, RefactoringCommand>();
  private consoleOutput: ConsoleOutput;
  private showIncomplete: boolean;

  constructor(consoleOutput: ConsoleOutput, showIncomplete = false) {
    this.consoleOutput = consoleOutput;
    this.showIncomplete = showIncomplete;
    this.registerCommands();
  }

  private registerCommands(): void {
    const commands = loadCommands();
    for (const command of commands) {
      command.setConsoleOutput(this.consoleOutput);
      this.commands.set(command.name, command);
    }
  }

  getAllCommands(): RefactoringCommand[] {
    const allCommands = Array.from(this.commands.values());
    if (this.showIncomplete) {
      return allCommands;
    }
    return allCommands.filter(cmd => cmd.complete);
  }
}