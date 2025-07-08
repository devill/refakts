import {CommandValidator} from "../validators/command-validator";

interface TokenizerState {
  current: string;
  inQuotes: boolean;
  quoteChar: string;
}

export class CommandLineTokenizer {
  tokenize(commandString: string): { commandName: string; locationString: string; options: string[] } {
    const args = this.processString(commandString);
    CommandValidator.validateParsedCommandString(args, commandString);
    
    return {
      commandName: args[0],
      locationString: args[1],
      options: args.slice(2)
    };
  }

  private processString(commandString: string) {
    const args: string[] = [];
    const state = this.createParsingState();

    this.processAllCharacters(commandString, args, state);
    this.addArgumentIfPresent(args, state.current);
    return this.argsWithoutCommand(args)
  }

  private createParsingState(): TokenizerState {
    return { current: '', inQuotes: false, quoteChar: '' };
  }

  private processAllCharacters(commandString: string, args: string[], state: TokenizerState): void {
    for (let i = 0; i < commandString.length; i++) {
      this.processCharacter(commandString[i], args, state);
    }
  }

  private processCharacter(char: string, args: string[], state: TokenizerState): void {
    if (this.isQuoteStart(char, state.inQuotes)) this.handleQuoteStart(state, char);
    else if (this.isQuoteEnd(char, state.inQuotes, state.quoteChar)) this.handleQuoteEnd(state);
    else if (this.isArgumentSeparator(char, state.inQuotes)) this.handleArgumentSeparator(args, state);
    else this.handleRegularCharacter(char, state);
  }

  private handleArgumentSeparator(args: string[], state: TokenizerState): void {
    state.current = this.addArgumentIfPresent(args, state.current);
  }

  private handleRegularCharacter(char: string, state: TokenizerState): void {
    state.current += char;
  }

  private handleQuoteStart(state: TokenizerState, char: string): void {
    state.inQuotes = true;
    state.quoteChar = char;
  }

  private handleQuoteEnd(state: TokenizerState): void {
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

  private argsWithoutCommand(args: string[]) {
    return args[0] === 'refakts' ? args.slice(1) : args;
  }
}