import {CommandOptions, RefactoringCommand} from './command';
import {ConsoleOutput} from '../../command-line-parser/output-formatter/console-output';
import {LocationParser, LocationRange, UsageLocation} from '../ast/location-range';
import {CrossFileReferenceFinder} from '../services/reference-finding/cross-file-reference-finder';
import {UsageResult} from './result-types/usage-result';
import {ASTService} from '../ast/ast-service';
import {PositionConverter} from '../services/position-converter';
import * as fs from 'fs';
import * as path from 'path';

export class FindUsagesCommand implements RefactoringCommand {
  readonly name = 'find-usages';
  readonly description = 'Find all usages of a symbol across files';
  readonly complete = true;
  private consoleOutput!: ConsoleOutput;

  async execute(targetLocation: string, options: CommandOptions): Promise<UsageResult> {
    const finalOptions = this.processTarget(targetLocation, options);
    this.validateOptions(finalOptions);

    return await this.executeFinUsagesOperation(finalOptions);
  }

  private async executeFinUsagesOperation(options: CommandOptions): Promise<UsageResult> {
    const location = LocationRange.from(options.location as LocationRange);
    return new UsageResult(await this.findUsages(location), location);
  }

  private async findUsages(location: LocationRange): Promise<UsageLocation[]> {
    try {
      return new CrossFileReferenceFinder(ASTService.createForFile(location.file).getProject())
        .findAllReferences(location.getNode())
        .map(node => PositionConverter.createUsageLocation(node.getSourceFile(), node));
    } catch (error) {
      return this.handleFindReferencesError(error);
    }
  }

  private handleFindReferencesError(error: unknown): UsageLocation[] {
    if (error instanceof Error && error.message.includes('No symbol found at location')) {
      return [];
    }
    throw error;
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
      return '\n' + fs.readFileSync(path.join(__dirname, 'find-usages.help.txt'), 'utf8');
    } catch {
      return '\nHelp file not found';
    }
  }

  setConsoleOutput(consoleOutput: ConsoleOutput): void {
    this.consoleOutput = consoleOutput;
  }
}