import { RefactoringCommand, CommandOptions } from './command';
import { ConsoleOutput } from '../../command-line-parser/output-formatter/console-output';
import { Node, SourceFile } from 'ts-morph';
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

  async execute(file: string, options: CommandOptions): Promise<void> {
    this.validateOptions(options);
    this.astService = ASTService.createForFile(file);
    this.variableLocator = new VariableLocator(this.astService.getProject());
    this.nameValidator = new VariableNameValidator();
    await this.performRename(this.findTargetNode(options), options.to as string);
    await this.astService.saveSourceFile(this.astService.loadSourceFile(file));
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
    
    this.validateNewName(nodeResult.declaration, newName);
    await this.createRenameTransformation(nodeResult, newName).transform(sourceFile);
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