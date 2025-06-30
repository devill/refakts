import { RefactoringCommand } from '../command';
import { VariableLocator } from '../locators/variable-locator';
import { tsquery } from '@phenomnomnominal/tsquery';
import * as yaml from 'js-yaml';

export class VariableLocatorCommand implements RefactoringCommand {
  readonly name = 'variable-locator';
  readonly description = 'Find variable declarations and all their usages';
  readonly complete = true;

  async execute(file: string, options: Record<string, any>): Promise<void> {
    this.validateOptions(options);
    
    try {
      const result = await this.performLocatorOperation(file, options);
      console.log(yaml.dump(result, { indent: 2 }));
    } catch (error) {
      this.handleExecutionError(error);
    }
  }

  private async performLocatorOperation(file: string, options: Record<string, any>) {
    const locator = new VariableLocator();
    return await this.executeLocatorOperation(file, options, locator);
  }

  private handleExecutionError(error: unknown): void {
    console.error('Error:', error);
    process.exit(1);
  }

  validateOptions(options: Record<string, any>): void {
    if (!options.query && (!options.line || !options.column)) {
      throw new Error('Either --query or both --line and --column must be specified');
    }
  }

  getHelpText(): string {
    return '\nExamples:\n  refakts variable-locator src/file.ts --query "Identifier[name=\'myVar\']"\n  refakts variable-locator src/file.ts --line 10 --column 5\n  refakts variable-locator src/file.ts --query "Parameter Identifier[name=\'param\']"';
  }

  private async executeLocatorOperation(file: string, options: any, locator: VariableLocator) {
    if (options.line && options.column) {
      return await locator.findVariableByPosition(file, parseInt(options.line), parseInt(options.column));
    } else {
      const variableName = this.extractVariableNameFromQuery(file, options.query);
      return await locator.findVariableReferences(file, variableName);
    }
  }

  private extractVariableNameFromQuery(file: string, query: string): string {
    const matches = this.executeQuery(file, query);
    const targetNode = this.getFirstMatch(matches);
    return this.extractNameFromNode(targetNode);
  }

  private executeQuery(file: string, query: string) {
    const sourceFileContent = require('fs').readFileSync(file, 'utf8');
    const ast = tsquery.ast(sourceFileContent);
    return tsquery(ast, query);
  }

  private getFirstMatch(matches: any[]) {
    if (matches.length === 0) {
      throw new Error('No matches found for query');
    }
    return matches[0];
  }

  private extractNameFromNode(targetNode: any): string {
    if (targetNode.kind === 75) {
      return (targetNode as any).text;
    } else {
      return this.findIdentifierInNode(targetNode);
    }
  }

  private findIdentifierInNode(targetNode: any): string {
    const identifiers = tsquery(targetNode, 'Identifier');
    if (identifiers.length === 0) {
      throw new Error('Could not extract variable name from query result');
    }
    return (identifiers[0] as any).text;
  }
}