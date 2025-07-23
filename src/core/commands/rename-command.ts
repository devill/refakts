import { RefactoringCommand, CommandOptions } from './command';
import { ConsoleOutput } from '../../interfaces/ConsoleOutput';
import { Node, SourceFile } from 'ts-morph';
import { ASTService } from '../ast/ast-service';
import { VariableLocator, VariableNodeResult } from '../locators/variable-locator';
import { RenameVariableTransformation } from '../transformations/rename-variable-transformation';
import { LocationRange } from '../ast/location-range';
import { NodeAnalyzer } from '../../locators/node-analyzer';

export class RenameCommand implements RefactoringCommand {
  readonly name = 'rename';
  readonly description = 'Rename a variable and all its references';
  readonly complete = true;

  private consoleOutput!: ConsoleOutput;
  private astService = new ASTService();
  private variableLocator: VariableLocator;

  constructor() {
    this.variableLocator = new VariableLocator(this.astService.getProject());
  }

  async execute(file: string, options: CommandOptions): Promise<void> {
    this.validateOptions(options);
    this.astService = ASTService.createForFile(file);
    this.variableLocator = new VariableLocator(this.astService.getProject());
    const sourceFile = this.astService.loadSourceFile(file);
    const node = this.findTargetNode(options);
    await this.performRename(node, options.to as string);
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

  private async performRename(node: Node, newName: string): Promise<void> {
    NodeAnalyzer.validateIdentifierNode(node);
    const sourceFile = node.getSourceFile();
    const nodeResult = this.findVariableNodesAtPosition(node, sourceFile);
    const transformation = this.createRenameTransformation(nodeResult, newName);
    await transformation.transform(sourceFile);
  }

  private findVariableNodesAtPosition(node: Node, sourceFile: SourceFile) {
    const targetPosition = sourceFile.getLineAndColumnAtPos(node.getStart());
    return this.variableLocator.findVariableNodesByPositionSync(
      sourceFile,
      targetPosition.line,
      targetPosition.column
    );
  }

  private createRenameTransformation(nodeResult: VariableNodeResult, newName: string) {
    return new RenameVariableTransformation(
      nodeResult.declaration,
      nodeResult.usages.map((u: { node: Node }) => u.node),
      newName
    );
  }

  setConsoleOutput(consoleOutput: ConsoleOutput): void {
    this.consoleOutput = consoleOutput;
  }
}