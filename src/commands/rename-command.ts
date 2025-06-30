import { RefactoringCommand, CommandOption } from '../command';
import { Project, Node } from 'ts-morph';
import { TSQueryHandler } from '../tsquery-handler';
import { VariableLocator } from '../locators/variable-locator';
import { RenameVariableTransformation } from '../transformations/rename-variable-transformation';
import * as path from 'path';

export class RenameCommand implements RefactoringCommand {
  readonly name = 'rename';
  readonly description = 'Rename a variable and all its references';
  readonly complete = true;

  private project = new Project();
  private tsQueryHandler = new TSQueryHandler();
  private variableLocator: VariableLocator;

  constructor() {
    this.variableLocator = new VariableLocator(this.project);
  }

  async execute(file: string, options: Record<string, any>): Promise<void> {
    this.validateOptions(options);
    const sourceFile = this.loadSourceFile(file);
    const node = this.tsQueryHandler.findNodeByQuery(sourceFile, options.query);
    await this.performRename(node, options.to);
    await sourceFile.save();
  }

  validateOptions(options: Record<string, any>): void {
    if (!options.query) {
      throw new Error('--query must be specified');
    }
    if (!options.to) {
      throw new Error('--to must be specified for rename operations');
    }
  }

  getHelpText(): string {
    return '\nExamples:\n  refakts rename src/file.ts --query "Identifier[name=\'oldName\']" --to newName\n  refakts rename src/file.ts --query "Parameter[name=\'param\']" --to newParam';
  }

  getOptions(): CommandOption[] {
    return [
      this.createQueryOption(),
      this.createToOption()
    ];
  }

  private createQueryOption(): CommandOption {
    return {
      flags: '--query <selector>',
      description: 'Target identifier or expression to refactor'
    };
  }

  private createToOption(): CommandOption {
    return {
      flags: '--to <newName>',
      description: 'New name for rename operations'
    };
  }

  private loadSourceFile(filePath: string) {
    const absolutePath = path.resolve(filePath);
    return this.project.addSourceFileAtPath(absolutePath);
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