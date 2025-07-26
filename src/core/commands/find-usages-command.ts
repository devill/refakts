import {CommandOptions, RefactoringCommand} from './command';
import {ConsoleOutput} from '../../command-line-parser/output-formatter/console-output';
import {LocationParser, LocationRange, UsageLocation} from '../ast/location-range';
import {CrossFileReferenceFinder} from '../services/reference-finding/cross-file-reference-finder';
import {UsageOutputHandler} from '../../command-line-parser/output-formatter/usage-output-handler';
import {ASTService} from '../ast/ast-service';
import {PositionConverter} from '../services/position-converter';
import {Node, SourceFile} from 'ts-morph';
import * as fs from 'fs';
import * as path from 'path';

export class FindUsagesCommand implements RefactoringCommand {
  readonly name = 'find-usages';
  readonly description = 'Find all usages of a symbol across files';
  readonly complete = true;
  private consoleOutput!: ConsoleOutput;
  private outputHandler!: UsageOutputHandler;
  
  async execute(targetLocation: string, options: CommandOptions): Promise<void> {
    const finalOptions = this.processTarget(targetLocation, options);
    this.validateOptions(finalOptions);
    
    await this.executeFinUsagesOperation(finalOptions);
  }

  private async executeFinUsagesOperation(options: CommandOptions): Promise<void> {
    const location = LocationRange.from(options.location as LocationRange);
    const usages = await this.findUsages(location);
    this.outputHandler.outputUsages({ 
      usages, 
      baseDir: process.cwd(), 
      targetLocation: location, 
      options 
    });
  }

  private async findUsages(location: LocationRange): Promise<UsageLocation[]> {
    try {
      const astService = ASTService.createForFile(location.file);
      return new CrossFileReferenceFinder(astService.getProject())
        .findAllReferences(this.getNodeFor(location, astService))
        .map(node => PositionConverter.createUsageLocation(node.getSourceFile(), node));
    } catch (error) {
      return this.handleFindReferencesError(error);
    }
  }

  private getNodeFor(location: LocationRange, astService: ASTService) {
    return this.extractNodeFromLocation(this.getValidSourceFile(astService, location), location);
  }

  private handleFindReferencesError(error: unknown): UsageLocation[] {
    if (error instanceof Error && error.message.includes('No symbol found at location')) {
      return [];
    }
    throw error;
  }

  private getValidSourceFile(astService: ASTService, location: LocationRange): SourceFile {
    const sourceFile = astService.loadSourceFile(location.file);
    this.checkForCompilationErrors(sourceFile, location.file);
    location.validateLocationBounds(sourceFile);
    return sourceFile;
  }

  private checkForCompilationErrors(sourceFile: SourceFile, fileName: string): void {
    const diagnostics = sourceFile.getPreEmitDiagnostics();
    if (diagnostics.length > 0) {
      throw new Error(`TypeScript compilation error in ${fileName}`);
    }
  }

  private extractNodeFromLocation(sourceFile: SourceFile, location: LocationRange): Node {
    const startPos = PositionConverter.getStartPosition(sourceFile, location);
    const node = sourceFile.getDescendantAtPos(startPos);
    if (!node) {
      throw new Error(`No symbol found at location ${location.start.line}:${location.start.column}`);
    }
    const symbol = node.getSymbol();
    if (!symbol) {
      throw new Error(`No symbol found at location ${location.start.line}:${location.start.column}`);
    }
    return node;
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