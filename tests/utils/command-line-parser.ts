import {CommandLineTokenizer} from './tokenizer/command-line-tokenizer';
import {LocationParser} from './parsers/location-parser';
import {OptionParser} from './parsers/option-parser';

export interface ParsedCommand {
  commandString: string;
  commandName: string;
  file: string;
  options: any;
}

export class CommandLineParser {
  private tokenizer: CommandLineTokenizer;
  private locationParser: LocationParser;
  private optionParser: OptionParser;

  constructor() {
    this.tokenizer = new CommandLineTokenizer();
    this.locationParser = new LocationParser();
    this.optionParser = new OptionParser();
  }

  parseCommand(commandString: string): ParsedCommand {
    const { commandName, locationString, options } = this.tokenizer.tokenize(commandString.trim());
    const locationResult = this.locationParser.parse(locationString);
    return {
      commandString: commandString,
      commandName: commandName,
      file: locationResult.file,
      options: this.buildOptionsWithLocation(options, locationResult.location)
    };
  }

  private buildOptionsWithLocation(args: string[],  location: any): any {
    const options = this.optionParser.parse(args);
    
    if (location) {
      options.location = location;
    }
    
    return options;
  }
}