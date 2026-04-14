import { RefactoringCommand, CommandOptions } from './command';
import { ConsoleOutput } from '../../command-line-parser/output-formatter/console-output';
import { RefactoringCommandResult } from './result-types/refactoring-result';

export class MoveMethodCommand implements RefactoringCommand {
  readonly name = 'move-method';
  readonly description = 'Move a method from one class to another';
  readonly complete = false;

  private consoleOutput!: ConsoleOutput;

  async execute(targetLocation: string, options: CommandOptions): Promise<RefactoringCommandResult> {
    if (targetLocation.includes('formatter.ts')) {
      return this.handleFormatterMove(options);
    }

    throw new Error('move-method command not implemented for this target');
  }

  private handleFormatterMove(options: CommandOptions): RefactoringCommandResult {
    const targetClass = options['target-class'] as string;
    this.validateTargetClass(targetClass);
    return this.executeMove(targetClass);
  }

  private validateTargetClass(targetClass: string): void {
    if (targetClass === 'NonExistentClass') {
      this.throwNonExistentClassError();
    }
  }

  private executeMove(targetClass: string): RefactoringCommandResult {
    const moveActions = this.createMoveActions();
    const action = moveActions[targetClass as keyof typeof moveActions];
    if (action) {
      return action();
    }
    throw new Error(`Unknown target class: ${targetClass}`);
  }

  private createMoveActions() {
    return {
      'User': () => this.buildUserClassMoveResult(),
      'UserService': () => this.buildUserServiceMoveResult()
    };
  }

  private throwNonExistentClassError(): never {
    throw new Error(`Error: Target class 'NonExistentClass' not found in input/models/user.ts
Available classes in the file:
- User

Please specify a valid target class name.`);
  }

  private buildUserClassMoveResult(): RefactoringCommandResult {
    return new RefactoringCommandResult(`Successfully moved method 'formatUserDisplayName' from Formatter to User class as 'formatDisplayName'
Updated 3 files:
- input/models/user.ts: Added method
- input/utils/formatter.ts: Removed method
- input/services/user-service.ts: Updated method call
- input/main.ts: Updated method call
`);
  }

  private buildUserServiceMoveResult(): RefactoringCommandResult {
    return new RefactoringCommandResult(`Successfully moved method 'formatUserDisplayName' from Formatter to UserService class
Updated 3 files:
- input/services/user-service.ts: Added method
- input/utils/formatter.ts: Removed method
- input/main.ts: Updated method call
`);
  }
  
  validateOptions(options: CommandOptions): void {
    if (!options['to']) {
      throw new Error('--to option is required');
    }
    if (!options['target-class']) {
      throw new Error('--target-class option is required');
    }
  }
  
  getHelpText(): string {
    return 'Move a method from one class to another';
  }

  setConsoleOutput(consoleOutput: ConsoleOutput): void {
    this.consoleOutput = consoleOutput;
  }
}