import { SourceFile, Node } from 'ts-morph';
import { Transformation, TransformationResult } from './transformation';
import { VariableLocator, VariableLocationResult } from '../locators/variable-locator';

/**
 * Transformation that renames a specific variable declaration and all its usages within the same scope.
 */
export class RenameVariableTransformation implements Transformation {
  private variableLocator = new VariableLocator();

  constructor(
    private readonly targetNode: Node,
    private readonly newName: string
  ) {}

  async transform(sourceFile: SourceFile): Promise<void> {
    const result = await this.transformWithResult(sourceFile);
    if (!result.success) {
      throw new Error(result.message || 'Rename transformation failed');
    }
  }

  async transformWithResult(sourceFile: SourceFile): Promise<TransformationResult> {
    try {
      const variableName = this.targetNode.getText();
      
      // Write the source file to a temporary location so VariableLocator can read it
      const filePath = sourceFile.getFilePath();
      await sourceFile.save();
      
      // Get the position of the target node to find the specific declaration
      const targetPosition = sourceFile.getLineAndColumnAtPos(this.targetNode.getStart());
      
      const locationResult = await this.variableLocator.findVariableByPosition(
        filePath,
        targetPosition.line,
        targetPosition.column
      );

      const changesCount = this.performRename(sourceFile, locationResult);

      return {
        success: true,
        changesCount,
        message: `Renamed ${changesCount} occurrences of '${variableName}' to '${this.newName}'`
      };
    } catch (error) {
      return {
        success: false,
        changesCount: 0,
        message: error instanceof Error ? error.message : 'Unknown error during rename'
      };
    }
  }

  private performRename(sourceFile: SourceFile, locationResult: VariableLocationResult): number {
    let changesCount = 0;

    // Rename declaration
    const declarationNode = this.findNodeAtPosition(
      sourceFile,
      locationResult.declaration.line,
      locationResult.declaration.column
    );
    if (declarationNode) {
      declarationNode.replaceWithText(this.newName);
      changesCount++;
    }

    // Rename all usages
    for (const usage of locationResult.usages) {
      const usageNode = this.findNodeAtPosition(sourceFile, usage.line, usage.column);
      if (usageNode) {
        usageNode.replaceWithText(this.newName);
        changesCount++;
      }
    }

    return changesCount;
  }

  private findNodeAtPosition(sourceFile: SourceFile, line: number, column: number): Node | undefined {
    // Convert 1-based line/column to 0-based position
    const position = sourceFile.compilerNode.getPositionOfLineAndCharacter(line - 1, column - 1);
    const node = sourceFile.getDescendantAtPos(position);
    
    // Find the identifier node if we're at a different kind of node
    if (node?.getKind() === 80) { // SyntaxKind.Identifier
      return node;
    }
    
    // If not an identifier, try to find an identifier child
    return node?.getFirstChildByKind(80); // SyntaxKind.Identifier
  }
}