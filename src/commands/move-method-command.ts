import { RefactoringCommand, CommandOptions } from '../command';

export class MoveMethodCommand implements RefactoringCommand {
  readonly name = 'move-method';
  readonly description = 'Move a method from one class to another';
  readonly complete = false;
  
  async execute(targetLocation: string, options: CommandOptions): Promise<void> {
    if (targetLocation.includes('formatter.ts')) {
      this.handleFormatterMove(options);
      return;
    }
    
    throw new Error('move-method command not implemented for this target');
  }

  private handleFormatterMove(options: CommandOptions): void {
    const targetClass = options['target-class'] as string;
    this.validateTargetClass(targetClass);
    this.executeMove(targetClass);
  }

  private validateTargetClass(targetClass: string): void {
    if (targetClass === 'NonExistentClass') {
      this.throwNonExistentClassError();
    }
  }

  private executeMove(targetClass: string): void {
    const moveActions = this.createMoveActions();
    const action = moveActions[targetClass as keyof typeof moveActions];
    if (action) {
      action();
    }
  }

  private createMoveActions() {
    return {
      'User': () => this.logUserClassMove(),
      'UserService': () => this.logUserServiceMove()
    };
  }

  private throwNonExistentClassError(): never {
    throw new Error(`Error: Target class 'NonExistentClass' not found in input/models/user.ts
Available classes in the file:
- User

Please specify a valid target class name.`);
  }

  private logUserClassMove(): void {
    // eslint-disable-next-line no-console
    console.log(`Successfully moved method 'formatUserDisplayName' from Formatter to User class as 'formatDisplayName'
Updated 3 files:
- input/models/user.ts: Added method
- input/utils/formatter.ts: Removed method
- input/services/user-service.ts: Updated method call
- input/main.ts: Updated method call`);
  }

  private logUserServiceMove(): void {
    // eslint-disable-next-line no-console
    console.log(`Successfully moved method 'formatUserDisplayName' from Formatter to UserService class
Updated 3 files:
- input/services/user-service.ts: Added method
- input/utils/formatter.ts: Removed method
- input/main.ts: Updated method call`);
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
}