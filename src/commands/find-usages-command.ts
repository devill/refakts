import {CommandOptions, RefactoringCommand} from '../command';
import {LocationParser, LocationRange, UsageLocation} from '../core/location-range';
import {ASTService} from '../services/ast-service';
import {CrossFileReferenceFinder} from '../services/cross-file-reference-finder';
import {ProjectScopeService} from '../services/project-scope-service';
import {SourceFile} from 'ts-morph';

export class FindUsagesCommand implements RefactoringCommand {
  readonly name = 'find-usages';
  readonly description = 'Find all usages of a symbol across files';
  readonly complete = false;
  
  private astService = new ASTService();
  private projectScopeService = new ProjectScopeService(this.astService.getProject());
  
  async execute(targetLocation: string, options: CommandOptions): Promise<void> {
    const finalOptions = this.processTarget(targetLocation, options);
    this.validateOptions(finalOptions);
    
    await this.executeFinUsagesOperation(finalOptions);
  }

  private async executeFinUsagesOperation(options: CommandOptions): Promise<void> {
    const location = LocationRange.from(options.location as LocationRange);
    const sourceFile = this.validateSourceFile(location);
    const usages = await this.findReferences(location, sourceFile);
    this.outputResults(usages, process.cwd(), location);
  }

  private validateSourceFile(location: LocationRange): SourceFile {
    const sourceFile = this.astService.loadSourceFile(location.file);
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

  private async findReferences(location: LocationRange, sourceFile: SourceFile) {
    const finder = this.createReferenceFinder(location);
    try {
      const result = await finder.findAllReferences(location, sourceFile);
      return result.usages;
    } catch (error) {
      return this.handleFindReferencesError(error);
    }
  }

  private createReferenceFinder(location: LocationRange) {
    const project = this.astService.getProject();
    const finder = new CrossFileReferenceFinder(project);
    const scopeDirectory = this.projectScopeService.determineScopeDirectory(location.file);
    return { findAllReferences: (loc: LocationRange, sf: SourceFile) => finder.findAllReferences(loc, sf, scopeDirectory) };
  }

  private handleFindReferencesError(error: unknown): UsageLocation[] {
    if (error instanceof Error && error.message.includes('No symbol found at location')) {
      return [];
    }
    throw error;
  }

  


  private outputResults(usages: UsageLocation[], baseDir: string, targetLocation: LocationRange): void {
    if (usages.length === 0) {
      this.outputNoSymbolMessage();
      return;
    }
    
    this.outputUsageResults(usages, baseDir, targetLocation);
  }

  private outputNoSymbolMessage(): void {
    process.stdout.write('Symbol not found at specified location\n');
  }

  private outputUsageResults(usages: UsageLocation[], baseDir: string, targetLocation: LocationRange): void {
    const sortedUsages = this.sortUsages(usages, targetLocation);
    const { declaration, otherUsages } = this.separateDeclarationFromUsages(sortedUsages, targetLocation);
    
    this.outputDeclaration(declaration, baseDir);
    this.outputUsagesSection(otherUsages, baseDir, declaration);
  }

  private separateDeclarationFromUsages(sortedUsages: UsageLocation[], targetLocation: LocationRange) {
    const declaration = sortedUsages.find(usage => this.isTargetLocation(usage, targetLocation));
    const otherUsages = sortedUsages.filter(usage => !this.isTargetLocation(usage, targetLocation));
    return { declaration, otherUsages };
  }

  private outputDeclaration(declaration: UsageLocation | undefined, baseDir: string): void {
    if (declaration) {
      process.stdout.write('Declaration:\n');
      this.outputSingleUsage(declaration, baseDir);
    }
  }

  private outputUsagesSection(otherUsages: UsageLocation[], baseDir: string, declaration: UsageLocation | undefined): void {
    if (otherUsages.length === 0 || !declaration) {
      return;
    }
    
    this.outputUsagesByType(otherUsages, baseDir);
  }

  private outputUsagesByType(otherUsages: UsageLocation[], baseDir: string): void {
    const { writeUsages, readUsages } = this.separateUsagesByType(otherUsages);
    
    if (writeUsages.length > 0) {
      this.outputReadWriteSeparatedUsages(writeUsages, readUsages, baseDir);
    } else {
      this.outputSimpleUsages(otherUsages, baseDir);
    }
  }

  private outputReadWriteSeparatedUsages(writeUsages: UsageLocation[], readUsages: UsageLocation[], baseDir: string): void {
    process.stdout.write('\nWrite Usages:\n');
    writeUsages.forEach(usage => this.outputSingleUsage(usage, baseDir));
    
    if (readUsages.length > 0) {
      process.stdout.write('\nRead Usages:\n');
      readUsages.forEach(usage => this.outputSingleUsage(usage, baseDir));
    }
  }

  private outputSimpleUsages(usages: UsageLocation[], baseDir: string): void {
    process.stdout.write('\n');
    process.stdout.write('Usages:\n');
    usages.forEach(usage => this.outputSingleUsage(usage, baseDir));
  }

  private separateUsagesByType(usages: UsageLocation[]): { writeUsages: UsageLocation[], readUsages: UsageLocation[] } {
    const writeUsages = usages.filter(usage => usage.usageType === 'write');
    const readUsages = usages.filter(usage => usage.usageType === 'read');
    return { writeUsages, readUsages };
  }

  private outputSingleUsage(usage: UsageLocation, baseDir: string): void {
    const formattedLocation = this.formatUsageLocation(usage, baseDir);
    process.stdout.write(`${formattedLocation} ${usage.text}\n`);
  }

  private formatUsageLocation(usage: UsageLocation, baseDir: string): string {
    return usage.location.formatLocation(baseDir);
  }

  private sortUsages(usages: UsageLocation[], targetLocation: LocationRange): UsageLocation[] {
    return usages.sort((a, b) => this.compareUsageLocations(a, b, targetLocation));
  }

  private compareUsageLocations(a: UsageLocation, b: UsageLocation, targetLocation: LocationRange): number {
    const definitionComparison = this.compareByDefinitionPriority(a, b, targetLocation);
    if (definitionComparison !== 0) return definitionComparison;
    
    return this.compareByLocation(a, b);
  }

  private compareByDefinitionPriority(a: UsageLocation, b: UsageLocation, targetLocation: LocationRange): number {
    const aIsDefinition = this.isTargetLocation(a, targetLocation);
    const bIsDefinition = this.isTargetLocation(b, targetLocation);
    
    if (aIsDefinition && !bIsDefinition) return -1;
    if (!aIsDefinition && bIsDefinition) return 1;
    return 0;
  }

  private compareByLocation(a: UsageLocation, b: UsageLocation): number {
    return a.location.compareToLocation(b.location);
  }

  private isTargetLocation(usage: UsageLocation, targetLocation: LocationRange): boolean {
    return usage.location.matchesTarget(targetLocation.file, targetLocation.start.line);
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
    return '\nExamples:\n  refakts find-usages "[src/file.ts 10:5-10:10]"\n  refakts find-usages "[src/file.ts 3:15-3:20]"';
  }
}