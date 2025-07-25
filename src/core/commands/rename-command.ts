import { RefactoringCommand, CommandOptions } from './command';
import { ConsoleOutput } from '../../command-line-parser/output-formatter/console-output';
import { Node } from 'ts-morph';
import { ASTService } from '../ast/ast-service';
import { UsageFinderService } from '../services/usage-finder-service';
import { RenameVariableTransformation } from '../transformations/rename-variable-transformation';
import { LocationRange, UsageLocation } from '../ast/location-range';
import { NodeAnalyzer } from '../services/node-analyzer';

export class RenameCommand implements RefactoringCommand {
  readonly name = 'rename';
  readonly description = 'Rename a variable and all its references';
  readonly complete = true;

  private consoleOutput!: ConsoleOutput;
  private astService!: ASTService;
  private usageFinderService = new UsageFinderService();

  async execute(file: string, options: CommandOptions): Promise<void> {
    this.validateOptions(options);
    this.astService = ASTService.createForFile(file);
    const sourceFile = this.astService.loadSourceFile(file);
    const node = this.findTargetNode(options);
    await this.performRename(node, options.location as LocationRange, options.to as string);
    await this.astService.saveSourceFile(sourceFile);
  }

  private findTargetNode(options: CommandOptions): Node {
    return this.astService.findNodeByLocation(options.location as LocationRange);
  }

  validateOptions(options: CommandOptions): void {
    if (!options.location) {
      throw new Error('Location format must be specified');
    }
    if (!options.to) {
      throw new Error('--to must be specified for rename operations');
    }
  }

  getHelpText(): string {
    return '\nExamples:\n  refakts rename "[src/file.ts 5:8-5:18]" --to newName';
  }

  private async performRename(node: Node, location: LocationRange, newName: string): Promise<void> {
    NodeAnalyzer.validateIdentifierNode(node);
    const usages = await this.usageFinderService.findUsages(location);
    const transformation = this.createRenameTransformation(usages, newName);
    await transformation.transform(node.getSourceFile());
  }

  private createRenameTransformation(usages: UsageLocation[], newName: string) {
    const declarationNode = this.findDeclarationNode(usages);
    const usageNodes = this.getUsageNodes(usages);
    
    return new RenameVariableTransformation(
      declarationNode,
      usageNodes,
      newName
    );
  }

  private findDeclarationNode(usages: UsageLocation[]): Node {
    if (usages.length === 0) {
      throw new Error('No usages found');
    }
    
    const firstUsage = usages[0];
    const astService = ASTService.createForFile(firstUsage.location.file);
    return astService.findNodeByLocation(firstUsage.location);
  }

  private getUsageNodes(usages: UsageLocation[]): Node[] {
    return usages.map(usage => {
      const astService = ASTService.createForFile(usage.location.file);
      return astService.findNodeByLocation(usage.location);
    });
  }

  setConsoleOutput(consoleOutput: ConsoleOutput): void {
    this.consoleOutput = consoleOutput;
  }
}