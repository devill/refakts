export class CommandValidator {
  validateFormat(args: string[], commandString: string): void {
    if (args.length < 2) {
      throw new Error(`Invalid command format: ${commandString}`);
    }
  }

  validateMinimumArgs(args: string[], startIndex: number, commandString: string): void {
    if (args.length < startIndex + 2) {
      throw new Error(`Invalid command format: ${commandString}`);
    }
  }

  getCommandStartIndex(args: string[]): number {
    return args[0] === 'refakts' ? 1 : 0;
  }
}