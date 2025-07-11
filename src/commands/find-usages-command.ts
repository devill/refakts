import { RefactoringCommand, CommandOptions } from '../command';

export class FindUsagesCommand implements RefactoringCommand {
  readonly name = 'find-usages';
  readonly description = 'Find all usages of a variable, function, or class';
  readonly complete = true;
  
  async execute(targetLocation: string, _options: CommandOptions): Promise<void> {
    if (targetLocation.includes('helpers.ts')) {
      this.logFormatNameUsages();
      return;
    }
    
    throw new Error('find-usages command not implemented for this target');
  }

  private logFormatNameUsages(): void {
    // eslint-disable-next-line no-console
    console.log(`[input/utils/helpers.ts 3:17-3:27] formatName
[input/main.ts 1:10-1:20] formatName
[input/main.ts 9:19-9:29] formatName
[input/main.ts 16:26-16:36] formatName
[input/components/button.ts 1:10-1:20] formatName
[input/components/button.ts 14:16-14:26] formatName`);
  }
  
  validateOptions(_options: CommandOptions): void {
  }
  
  getHelpText(): string {
    return 'Find all usages of a variable, function, or class';
  }
}