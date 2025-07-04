import { SourceFile, Node } from 'ts-morph';
import { Transformation, TransformationResult } from './transformation';

export class RenameVariableTransformation implements Transformation {
  constructor(
    private readonly declaration: Node,
    private readonly usages: Node[],
    private readonly newName: string
  ) {}

  async transform(sourceFile: SourceFile): Promise<void> {
    const result = await this.transformWithResult();
    if (!result.success) {
      throw new Error(result.message || 'Rename transformation failed');
    }
  }

  async transformWithResult(): Promise<TransformationResult> {
    try {
      const variableName = this.declaration.getText();
      const changesCount = this.performDirectRename();
      return this.buildSuccessResult(variableName, changesCount);
    } catch (error) {
      return this.buildErrorResult(error);
    }
  }

  private performDirectRename(): number {
    const declarationChanges = this.renameDeclaration();
    const usageChanges = this.renameUsages();
    return declarationChanges + usageChanges;
  }

  private renameDeclaration(): number {
    const declarationIdentifier = this.findIdentifierInNode(this.declaration);
    if (declarationIdentifier) {
      declarationIdentifier.replaceWithText(this.newName);
      return 1;
    }
    return 0;
  }

  private renameUsages(): number {
    return this.renameAllUsageNodes();
  }

  private renameAllUsageNodes(): number {
    return this.processUsageNodes();
  }

  private processUsageNodes(): number {
    let changesCount = 0;
    for (const usage of this.usages) {
      if (this.renameUsageNode(usage)) changesCount++;
    }
    return changesCount;
  }

  private renameUsageNode(usage: Node): boolean {
    const usageIdentifier = this.findIdentifierInNode(usage);
    if (usageIdentifier) {
      usageIdentifier.replaceWithText(this.newName);
      return true;
    }
    return false;
  }
  
  private findIdentifierInNode(node: Node): Node | undefined {
    if (node.getKind() === 80) {
      return node;
    }
    return node.getFirstDescendantByKind(80);
  }

  private buildSuccessResult(variableName: string, changesCount: number): TransformationResult {
    return {
      success: true,
      changesCount,
      message: `Renamed ${changesCount} occurrences of '${variableName}' to '${this.newName}'`
    };
  }
  
  private buildErrorResult(error: unknown): TransformationResult {
    return {
      success: false,
      changesCount: 0,
      message: error instanceof Error ? error.message : 'Unknown error during rename'
    };
  }
}