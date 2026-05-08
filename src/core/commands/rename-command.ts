import { RefactoringCommand, CommandOptions } from './command';
import { ConsoleOutput } from '../../command-line-parser/output-formatter/console-output';
import { Node, SourceFile } from 'ts-morph';
import { RefactoringCommandResult } from './result-types/refactoring-result';
import { ASTService } from '../ast/ast-service';
import { VariableLocator, VariableNodeResult } from '../locators/variable-locator';
import { RenameVariableTransformation } from '../transformations/rename-variable-transformation';
import { LocationRange } from '../ast/location-range';
import { NodeAnalyzer } from '../services/node-analyzer';
import { VariableNameValidator } from '../services/variable-name-validator';
import { ScopeAnalyzer } from '../services/scope-analyzer';

export class RenameCommand implements RefactoringCommand {
  readonly name = 'rename';
  readonly description = 'Rename a variable and all its references';
  readonly complete = true;

  private consoleOutput!: ConsoleOutput;
  private astService!: ASTService;
  private variableLocator!: VariableLocator;
  private nameValidator!: VariableNameValidator;

  async execute(file: string, options: CommandOptions): Promise<RefactoringCommandResult> {
    this.validateOptions(options);
    const location = LocationRange.from(options.location as LocationRange);
    this.astService = ASTService.createForFile(file);
    this.variableLocator = new VariableLocator(this.astService.getProject());
    this.nameValidator = new VariableNameValidator();
    const result = await this.performRename(this.astService.findNodeByLocation(location), options.to as string);
    await this.astService.saveSourceFile(this.astService.loadSourceFile(file));
    return result;
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

  private async performRename(node: Node, newName: string): Promise<RefactoringCommandResult> {
    NodeAnalyzer.validateIdentifierNode(node);
    const nodeResult = this.findVariableNodesAtPosition(node, node.getSourceFile());
    this.validateNewName(nodeResult.declaration, newName);
    return this.applyRename(nodeResult, nodeResult.variable, newName);
  }

  private async applyRename(nodeResult: VariableNodeResult, oldName: string, newName: string): Promise<RefactoringCommandResult> {
    const transformResult = await this.createRenameTransformation(nodeResult, newName).transformWithResult();
    if (!transformResult.success) {
      throw new Error(transformResult.message || 'Rename transformation failed');
    }
    const count = transformResult.changesCount;
    return new RefactoringCommandResult(
      `Successfully renamed '${oldName}' to '${newName}' (${count} occurrence${count === 1 ? '' : 's'} renamed)`
    );
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

  private validateNewName(declarationNode: Node, newName: string): void {
    this.nameValidator.generateUniqueName(newName, ScopeAnalyzer.getNodeScope(declarationNode));
  }
}