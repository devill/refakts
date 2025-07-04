import { RefactoringCommand } from '../command';
import { VariableLocator } from '../locators/variable-locator';
import { LocationParser } from '../utils/location-parser';
import { ASTService } from '../services/ast-service';
import * as path from 'path';

export class VariableLocatorCommand implements RefactoringCommand {
  readonly name = 'variable-locator';
  readonly description = 'Find variable declarations and all their usages';
  readonly complete = true;
  private astService = new ASTService();

  async execute(target: string, options: Record<string, any>): Promise<void> {
    const finalOptions = this.processTarget(target, options);
    this.validateOptions(finalOptions);
    
    try {
      const result = await this.performLocatorOperation(finalOptions);
      this.outputResults(result);
    } catch (error) {
      this.handleExecutionError(error);
    }
  }

  private async performLocatorOperation(options: Record<string, any>) {
    const { location } = options;
    
    // Get the variable name from the selected location
    const node = await this.astService.findNodeByLocation(location);
    if (!node) {
      throw new Error('Could not find node at specified location');
    }
    
    const variableName = this.getVariableName(node);
    
    // Use the variable locator to find all references
    const locator = new VariableLocator();
    const result = await locator.findVariableReferences(location.file, variableName);
    
    // Use basename for consistent output format like select command
    const fileName = path.basename(location.file);
    return this.formatAsLocations(result, fileName);
  }

  private handleExecutionError(error: unknown): void {
    console.error('Error:', error);
    process.exit(1);
  }

  validateOptions(options: Record<string, any>): void {
    if (!options.location) {
      throw new Error('Location format must be specified');
    }
  }

  getHelpText(): string {
    return '\nExamples:\n  refakts variable-locator "[src/file.ts 10:5-10:10]"\n  refakts variable-locator "[src/file.ts 3:15-3:20]"';
  }


  private processTarget(target: string, options: Record<string, any>): Record<string, any> {
    if (LocationParser.isLocationFormat(target)) {
      const location = LocationParser.parseLocation(target);
      return { ...options, location };
    }
    
    // For backwards compatibility during migration
    return { ...options, target };
  }

  private formatAsLocations(result: any, fileName: string): string[] {
    const locations: string[] = [];
    
    // Add declaration
    if (result.declaration) {
      const decl = result.declaration;
      locations.push(`[${fileName} ${decl.line}:${decl.column}-${decl.line}:${decl.column + decl.text.length}] ${decl.text}`);
    }
    
    // Add usages
    if (result.usages) {
      for (const usage of result.usages) {
        locations.push(`[${fileName} ${usage.line}:${usage.column}-${usage.line}:${usage.column + usage.text.length}] ${usage.text}`);
      }
    }
    
    return locations;
  }

  private outputResults(results: string[]): void {
    results.forEach(result => console.log(result));
  }

  private getVariableName(node: any): string {
    // If it's already an identifier, return its text
    if (node.getKind() === 75) { // Identifier
      return node.getText();
    }
    
    // For simplicity, just return the text of the node
    // This works for most cases where we select a variable name
    const text = node.getText().trim();
    
    // If the text looks like a variable name (alphanumeric + underscore), use it
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(text)) {
      return text;
    }
    
    // Handle variable declarations, parameters, etc.
    if (node.getKind() === 261) { // VariableDeclarationList
      const variableDeclaration = node.getDeclarations()[0];
      if (variableDeclaration) {
        return variableDeclaration.getName();
      }
    }
    
    // Look for an identifier in the node
    const identifiers = node.getDescendantsOfKind(75); // Identifier
    if (identifiers.length > 0) {
      return identifiers[0].getText();
    }
    
    throw new Error('Could not extract variable name from node');
  }
}