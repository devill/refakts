import { RefactoringCommand } from '../command';
import { Node } from 'ts-morph';
import { ASTService } from '../services/ast-service';
import { VariableLocator } from '../locators/variable-locator';
import { RenameVariableTransformation } from '../transformations/rename-variable-transformation';
import { LocationRange } from '../utils/location-parser';

export class RenameCommand implements RefactoringCommand {
  readonly name = 'rename';
  readonly description = 'Rename a variable and all its references';
  readonly complete = true;

  private astService = new ASTService();
  private variableLocator: VariableLocator;

  constructor() {
    this.variableLocator = new VariableLocator(this.astService.getProject());
  }

  async execute(file: string, options: Record<string, any>): Promise<void> {
    this.validateOptions(options);
    const sourceFile = this.astService.loadSourceFile(file);
    const node = this.findTargetNode(sourceFile, options);
    await this.performRename(node, options.to);
    await this.astService.saveSourceFile(sourceFile);
  }

  private findTargetNode(sourceFile: any, options: Record<string, any>): Node {
    return options.location 
      ? this.astService.findNodeByLocation(options.location)
      : this.astService.findNodeByQuery(sourceFile, options.query);
  }

  validateOptions(options: Record<string, any>): void {
    if (!options.query && !options.location) {
      throw new Error('Either --query or location format must be specified');
    }
    if (!options.to) {
      throw new Error('--to must be specified for rename operations');
    }
  }

  getHelpText(): string {
    return '\nExamples:\n  refakts rename src/file.ts --query "Identifier[name=\'oldName\']" --to newName\n  refakts rename "[src/file.ts 5:8-5:18]" --to newName';
  }

  private async performRename(node: Node, newName: string): Promise<void> {
    this.validateIdentifierNode(node);
    const sourceFile = node.getSourceFile();
    const nodeResult = this.findVariableNodesAtPosition(node, sourceFile);
    const transformation = this.createRenameTransformation(nodeResult, newName);
    await transformation.transform(sourceFile);
  }

  private validateIdentifierNode(node: Node): void {
    if (node.getKind() !== 80) {
      throw new Error(`Expected identifier, got ${node.getKindName()}`);
    }
  }

  private findVariableNodesAtPosition(node: Node, sourceFile: any) {
    const targetPosition = sourceFile.getLineAndColumnAtPos(node.getStart());
    return this.variableLocator.findVariableNodesByPositionSync(
      sourceFile,
      targetPosition.line,
      targetPosition.column
    );
  }

  private createRenameTransformation(nodeResult: any, newName: string) {
    return new RenameVariableTransformation(
      nodeResult.declaration,
      nodeResult.usages.map((u: any) => u.node),
      newName
    );
  }
}