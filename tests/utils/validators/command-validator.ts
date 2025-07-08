export class CommandValidator {
  static validateParsedCommandString(args: string[], commandString: string) {
    this.validateFormat(args, commandString);
    this.validateMinimumArgs(args, 0, commandString);
  }

  private static validateFormat(args: string[], commandString: string): void {
    if (args.length < 2) {
      throw new Error(`Invalid command format: ${commandString}`);
    }
  }

  private static validateMinimumArgs(args: string[], startIndex: number, commandString: string): void {
    if (args.length < startIndex + 2) {
      throw new Error(`Invalid command format: ${commandString}`);
    }
  }
}