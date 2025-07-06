export interface ParsedCommand {
  commandName: string;
  file: string;
  options: any;
}

export class CommandLineParser {
  parseCommand(commandString: string): ParsedCommand {
    const args = this.parseCommandLineArgs(commandString.trim());
    this.validateCommandFormat(args, commandString);
    
    const startIndex = this.getCommandStartIndex(args);
    this.validateMinimumArgs(args, startIndex, commandString);
    
    return this.extractCommandComponents(args, startIndex);
  }

  private extractCommandComponents(args: string[], startIndex: number): ParsedCommand {
    const commandName = args[startIndex];
    const target = args[startIndex + 1];
    const options: any = {};
    
    const file = this.extractFileFromTarget(target, options);
    this.parseCommandOptions(args, startIndex, options);
    
    return { commandName, file, options };
  }

  private validateCommandFormat(args: string[], commandString: string): void {
    if (args.length < 2) {
      throw new Error(`Invalid command format: ${commandString}`);
    }
  }

  private getCommandStartIndex(args: string[]): number {
    return args[0] === 'refakts' ? 1 : 0;
  }

  private validateMinimumArgs(args: string[], startIndex: number, commandString: string): void {
    if (args.length < startIndex + 2) {
      throw new Error(`Invalid command format: ${commandString}`);
    }
  }

  private extractFileFromTarget(target: string, options: any): string {
    if (target.startsWith('[') && target.endsWith(']')) {
      return this.parseLocationFormat(target, options);
    }
    return target;
  }

  private parseLocationFormat(target: string, options: any): string {
    const file = this.extractFileFromLocationTarget(target);
    this.addLocationToOptions(target, options);
    return file;
  }

  private extractFileFromLocationTarget(target: string): string {
    const locationMatch = target.match(/^\[([^\]]+)\s+/);
    if (!locationMatch) {
      throw new Error(`Invalid location format: ${target}`);
    }
    return locationMatch[1];
  }

  private addLocationToOptions(target: string, options: any): void {
    const locationRegex = /^\[([^\]]+)\s+(\d+):(\d+)-(\d+):(\d+)\]$/;
    const match = target.match(locationRegex);
    
    if (match) {
      options.location = this.createLocationObject(match);
    }
  }

  private createLocationObject(match: RegExpMatchArray) {
    return {
      file: match[1],
      startLine: parseInt(match[2], 10),
      startColumn: parseInt(match[3], 10),
      endLine: parseInt(match[4], 10),
      endColumn: parseInt(match[5], 10)
    };
  }

  private parseCommandOptions(args: string[], startIndex: number, options: any): void {
    for (let i = startIndex + 2; i < args.length; i++) {
      const arg = args[i];
      
      if (arg.startsWith('--')) {
        i = this.processOptionFlag(args, i, options);
      }
    }
  }

  private processOptionFlag(args: string[], index: number, options: any): number {
    const optionName = this.extractOptionName(args[index]);
    const nextArg = args[index + 1];
    
    if (this.isBooleanFlag(nextArg)) {
      options[optionName] = true;
      return index;
    }
    
    this.setOptionValue(options, optionName, nextArg);
    return index + 1;
  }

  private extractOptionName(arg: string): string {
    return arg.slice(2);
  }

  private isBooleanFlag(nextArg: string): boolean {
    return !nextArg || nextArg.startsWith('--');
  }

  private setOptionValue(options: any, optionName: string, value: string): void {
    if (options[optionName] !== undefined) {
      this.addToExistingOption(options, optionName, value);
    } else {
      const numValue = Number(value);
      options[optionName] = isNaN(numValue) ? value : numValue;
    }
  }

  private addToExistingOption(options: any, optionName: string, value: string): void {
    if (!Array.isArray(options[optionName])) {
      options[optionName] = [options[optionName]];
    }
    options[optionName].push(value);
  }

  private parseCommandLineArgs(commandString: string): string[] {
    const args: string[] = [];
    const state = this.createParsingState();

    this.processAllCharacters(commandString, args, state);
    this.addArgumentIfPresent(args, state.current);
    
    return args;
  }

  private createParsingState() {
    return { current: '', inQuotes: false, quoteChar: '' };
  }

  private processAllCharacters(commandString: string, args: string[], state: any): void {
    for (let i = 0; i < commandString.length; i++) {
      this.processCharacter(commandString[i], args, state);
    }
  }

  private processCharacter(char: string, args: string[], state: any): void {
    if (this.isQuoteStart(char, state.inQuotes)) {
      this.handleQuoteStart(state, char);
    } else if (this.isQuoteEnd(char, state.inQuotes, state.quoteChar)) {
      this.handleQuoteEnd(state);
    } else if (this.isArgumentSeparator(char, state.inQuotes)) {
      this.handleArgumentSeparator(args, state);
    } else {
      this.handleRegularCharacter(char, state);
    }
  }

  private handleArgumentSeparator(args: string[], state: any): void {
    state.current = this.addArgumentIfPresent(args, state.current);
  }

  private handleRegularCharacter(char: string, state: any): void {
    state.current += char;
  }

  private handleQuoteStart(state: any, char: string): void {
    state.inQuotes = true;
    state.quoteChar = char;
  }

  private handleQuoteEnd(state: any): void {
    state.inQuotes = false;
    state.quoteChar = '';
  }

  private isQuoteStart(char: string, inQuotes: boolean): boolean {
    return (char === '"' || char === "'") && !inQuotes;
  }

  private isQuoteEnd(char: string, inQuotes: boolean, quoteChar: string): boolean {
    return char === quoteChar && inQuotes;
  }

  private isArgumentSeparator(char: string, inQuotes: boolean): boolean {
    return char === ' ' && !inQuotes;
  }

  private addArgumentIfPresent(args: string[], current: string): string {
    if (current.length > 0) {
      args.push(current);
      return '';
    }
    return current;
  }
}