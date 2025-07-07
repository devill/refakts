import { CommandLineTokenizer } from './tokenizer/command-line-tokenizer';
import { LocationParser } from './parsers/location-parser';
import { OptionParser } from './parsers/option-parser';
import { CommandValidator } from './validators/command-validator';

export interface ParsedCommand {
  commandName: string;
  file: string;
  options: any;
}

export class CommandLineParser {
  private tokenizer: CommandLineTokenizer;
  private locationParser: LocationParser;
  private optionParser: OptionParser;
  private validator: CommandValidator;

  constructor() {
    this.tokenizer = new CommandLineTokenizer();
    this.locationParser = new LocationParser();
    this.optionParser = new OptionParser();
    this.validator = new CommandValidator();
  }

  parseCommand(commandString: string): ParsedCommand {
    const args = this.tokenizer.tokenize(commandString.trim());
    this.validator.validateFormat(args, commandString);
    
    const startIndex = this.validator.getCommandStartIndex(args);
    this.validator.validateMinimumArgs(args, startIndex, commandString);
    
    return this.extractCommandComponents(args, startIndex);
  }

  private extractCommandComponents(args: string[], startIndex: number): ParsedCommand {
    const commandName = args[startIndex];
    const target = args[startIndex + 1];
    
    const locationResult = this.locationParser.parse(target);
    const options = this.buildOptionsWithLocation(args, startIndex, locationResult.location);
    
    return { commandName, file: locationResult.file, options };
  }

  private buildOptionsWithLocation(args: string[], startIndex: number, location: any): any {
    const options = this.optionParser.parse(args, startIndex);
    
    if (location) {
      options.location = location;
    }
    
    return options;
  }
}