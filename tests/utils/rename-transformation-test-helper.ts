import { Project, SourceFile, SyntaxKind, VariableDeclaration, Identifier } from 'ts-morph';
import { RenameVariableTransformation } from '../../src/transformations/rename-variable-transformation';

export interface TransformationScenarioConfig {
  fileName: string;
  sourceCode: string;
  oldName: string;
  newName: string;
}

export interface TransformationScenarioResult {
  sourceFile: SourceFile;
  transformation: RenameVariableTransformation;
  declaration: VariableDeclaration;
  usages: Identifier[];
}

export class RenameTransformationTestHelper {
  constructor(private _project: Project) {}

  static create(project: Project): RenameTransformationTestHelper {
    return new RenameTransformationTestHelper(project);
  }

  static createMockDeclaration(): any {
    return {
      getNameNode: () => ({ getText: () => 'mockName' }),
      getKind: () => SyntaxKind.VariableDeclaration,
      getFirstDescendantByKind: () => undefined
    } as any;
  }

  createTransformationScenario(config: TransformationScenarioConfig): TransformationScenarioResult {
    const sourceFile = this._project.createSourceFile(config.fileName, config.sourceCode);
    const { declaration, usages } = this.extractVariableComponents(sourceFile, config.oldName);
    const transformation = new RenameVariableTransformation(declaration, usages, config.newName);

    return { sourceFile, transformation, declaration, usages };
  }

  private extractVariableComponents(sourceFile: SourceFile, oldName: string) {
    const declaration = sourceFile.getVariableDeclarations()[0];
    const usages = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)
      .filter(id => id.getText() === oldName && id !== declaration.getNameNode());
    return { declaration, usages };
  }
}