import { RefactoringCommand, CommandOptions } from '../command';
import { VariableLocator } from '../locators/variable-locator';
import { Node } from 'ts-morph';
import { LocationParser, LocationRange } from '../utils/location-parser';
import { ASTService } from '../services/ast-service';
import { VariableLocationResult } from '../locators/variable-result-builder';
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
      const result = await this.performLocatorOperation(finalOptions);
      this.outputResults(result);
    } catch (error) {
      this.handleExecutionError(error);
    }
  }

  private async performLocatorOperation(options: CommandOptions) {
    const location = options.location as LocationRange;
    
    const node = await this.astService.findNodeByLocation(location);
    if (!node) {
      throw new Error('Could not find node at specified location');
    }
    
    const variableName = this.getVariableName(node);
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
    results.forEach(result => console.log(result));
  }

  private getVariableName(node: Node): string {
    if (this.isIdentifierNode(node)) {
      return node.getText();
    }
    
    const candidateName = this.extractCandidateName(node);
    if (candidateName) {
      return candidateName;
    }
    
    throw new Error('Could not extract variable name from node');
  }

  private isIdentifierNode(node: Node): boolean {
    return node.getKind() === 75;
  }

  private extractCandidateName(node: Node): string | null {
    const simpleTextName = this.trySimpleTextExtraction(node);
    if (simpleTextName) {
      return simpleTextName;
    }
    
    const declarationName = this.tryVariableDeclarationExtraction(node);
    if (declarationName) {
      return declarationName;
    }
    
    return this.tryIdentifierDescendantExtraction(node);
  }

  private trySimpleTextExtraction(node: Node): string | null {
    const text = node.getText().trim();
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(text) ? text : null;
  }

  private tryVariableDeclarationExtraction(node: Node): string | null {
    if (node.getKind() === 261) {
      const symbol = node.getSymbol();
      const declarations = symbol?.getDeclarations();
      const variableDeclaration = declarations?.[0];
      return variableDeclaration ? variableDeclaration.getText() : null;
    }
    return null;
  }

  private tryIdentifierDescendantExtraction(node: Node): string | null {
    const identifiers = node.getDescendantsOfKind(75);
    return identifiers.length > 0 ? identifiers[0].getText() : null;
  }
}