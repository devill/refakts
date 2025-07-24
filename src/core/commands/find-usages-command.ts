import {CommandOptions, RefactoringCommand} from './command';
import { ConsoleOutput } from '../../interfaces/ConsoleOutput';
import {LocationParser, LocationRange} from '../ast/location-range';
import {UsageFinderService} from '../services/usage-finder-service';
import {UsageOutputHandler} from '../../services/usage-output-handler';
import * as fs from 'fs';
import * as path from 'path';

export class FindUsagesCommand implements RefactoringCommand {
  readonly name = 'find-usages';
  readonly description = 'Find all usages of a symbol across files';
  readonly complete = true;
  private consoleOutput!: ConsoleOutput;
  private usageFinderService = new UsageFinderService();
  private outputHandler!: UsageOutputHandler;
  
  async execute(targetLocation: string, options: CommandOptions): Promise<void> {
    const finalOptions = this.processTarget(targetLocation, options);
    this.validateOptions(finalOptions);
    
    await this.executeFinUsagesOperation(finalOptions);
  }

  private async executeFinUsagesOperation(options: CommandOptions): Promise<void> {
    const location = LocationRange.from(options.location as LocationRange);
    const usages = await this.usageFinderService.findUsages(location);
    this.outputHandler.outputUsages({ 
      usages, 
      baseDir: process.cwd(), 
      targetLocation: location, 
      options 
    });
  }



  private processTarget(target: string, options: CommandOptions): CommandOptions {
    return LocationParser.processTarget(target, options) as CommandOptions;
  }
  
  validateOptions(options: CommandOptions): void {
    if (!options.location) {
      throw new Error('Location format must be specified');
    }

    LocationRange.from(options.location as LocationRange).validateRange();
  }

  getHelpText(): string {
    try {
      const helpFilePath = path.join(__dirname, 'find-usages.help.txt');
      return '\n' + fs.readFileSync(helpFilePath, 'utf8');
    } catch {
      return '\nHelp file not found';
    }
  }

  setConsoleOutput(consoleOutput: ConsoleOutput): void {
    this.consoleOutput = consoleOutput;
    this.outputHandler = new UsageOutputHandler(consoleOutput);
  }
}