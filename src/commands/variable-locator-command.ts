import { RefactoringCommand, CommandOptions } from '../command';
import { VariableLocator } from '../locators/variable-locator';
import { Node } from 'ts-morph';
import { LocationParser, LocationRange } from '../core/location-parser';
import { ASTService } from '../services/ast-service';
import { VariableLocationResult } from '../locators/variable-result-builder';
import { NodeAnalyzer } from '../locators/node-analyzer';
import * as path from 'path';

export class VariableLocatorCommand implements RefactoringCommand {
  readonly name = 'variable-locator';
  readonly description = 'Find variable declarations and all their usages';
  readonly complete = true;
  private astService = new ASTService();

  async execute(target: string, options: CommandOptions): Promise<void> {
    const finalOptions = this.processTarget(target, options);
    this.validateOptions(finalOptions);
    
    try {
      await this.executeLocatorOperation(finalOptions);
    } catch (error) {
      this.handleExecutionError(error);
    }
  }

  private async executeLocatorOperation(options: CommandOptions): Promise<void> {
    const result = await this.performLocatorOperation(options);
    this.outputResults(result);
  }

  private async performLocatorOperation(options: CommandOptions) {
    const location = options.location as LocationRange;
    const node = await this.findTargetNode(location);
    const variableName = this.getVariableName(node);
    
    return await this.findAndFormatReferences(location, variableName);
  }

  private async findTargetNode(location: LocationRange): Promise<Node> {
    const node = await this.astService.findNodeByLocation(location);
    if (!node) {
      throw new Error('Could not find node at specified location');
    }
    return node;
  }

  private async findAndFormatReferences(location: LocationRange, variableName: string): Promise<string[]> {
    const locator = new VariableLocator();
    const result = await locator.findVariableReferences(location.file, variableName);
    const fileName = path.basename(location.file);
    
    return this.formatAsLocations(result, fileName);
  }

  private handleExecutionError(error: unknown): void {
    process.stderr.write(`Error: ${error}\n`);
    process.exit(1);
  }

  validateOptions(options: CommandOptions): void {
    if (!options.location) {
      throw new Error('Location format must be specified');
    }
  }

  getHelpText(): string {
    return '\nExamples:\n  refakts variable-locator "[src/file.ts 10:5-10:10]"\n  refakts variable-locator "[src/file.ts 3:15-3:20]"';
  }


  private processTarget(target: string, options: CommandOptions): CommandOptions {
    if (LocationParser.isLocationFormat(target)) {
      const location = LocationParser.parseLocation(target);
      return { ...options, location };
    }
    
    return { ...options, target };
  }

  private formatAsLocations(result: VariableLocationResult, fileName: string): string[] {
    const locations: string[] = [];
    
    this.addDeclarationLocation(result, fileName, locations);
    this.addUsageLocations(result, fileName, locations);
    
    return locations;
  }

  private addDeclarationLocation(result: VariableLocationResult, fileName: string, locations: string[]): void {
    if (result.declaration) {
      const decl = result.declaration;
      locations.push(`[${fileName} ${decl.line}:${decl.column}-${decl.line}:${decl.column + decl.text.length}] ${decl.text}`);
    }
  }

  private addUsageLocations(result: VariableLocationResult, fileName: string, locations: string[]): void {
    if (result.usages) {
      for (const usage of result.usages) {
        locations.push(`[${fileName} ${usage.line}:${usage.column}-${usage.line}:${usage.column + usage.text.length}] ${usage.text}`);
      }
    }
  }

  private outputResults(results: string[]): void {
    // eslint-disable-next-line no-console
    results.forEach(result => console.log(result));
  }

  private getVariableName(node: Node): string {
    return NodeAnalyzer.getVariableNameFromNode(node);
  }
}