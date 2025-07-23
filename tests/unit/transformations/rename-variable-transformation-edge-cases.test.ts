import { RenameVariableTransformation } from '../../../src/core/transformations/rename-variable-transformation';
import { Project } from 'ts-morph';
import { verify } from 'approvals';

describe('RenameVariableTransformation Edge Cases', () => {
  let project: Project;

  beforeEach(() => {
    project = new Project({ useInMemoryFileSystem: true });
  });

  function createTestTransformation(sourceCode: string) {
    const sourceFile = project.createSourceFile('test.ts', sourceCode);
    const declaration = sourceFile.getVariableDeclarations()[0];
    return new RenameVariableTransformation(declaration, [], 'newName');
  }

  it('should handle empty usages array', async () => {
    const transformation = createTestTransformation(`
      const oldName = 42;
    `);

    const result = await transformation.transformWithResult();

    verify(__dirname, 'edge-case-empty-usages', JSON.stringify(result, null, 2), { reporters: ['donothing'] });
  });

  it('should handle complex declaration nodes', async () => {
    const transformation = createTestTransformation(`
      const { oldName } = { oldName: 42 };
    `);

    const result = await transformation.transformWithResult();

    verify(__dirname, 'edge-case-complex-declaration', JSON.stringify(result, null, 2), { reporters: ['donothing'] });
  });
});