import { RenameVariableTransformation } from '../../../src/core/transformations/rename-variable-transformation';
import { Project, SyntaxKind } from 'ts-morph';
import { RenameTransformationTestHelper } from '../../utils/rename-transformation-test-helper';
import { verify } from 'approvals';

function createMockDeclarationThatThrowsError() {
  return {
    getText: () => { throw new Error('Mock error'); },
    getKind: () => SyntaxKind.VariableDeclaration,
    getFirstDescendantByKind: () => undefined
  } as any;
}

function createMockDeclarationForUnsuccessfulResult() {
  return {
    getText: () => 'oldName',
    getKind: () => SyntaxKind.VariableDeclaration,
    getFirstDescendantByKind: () => undefined
  } as any;
}

function createErrorMockTransformation(project: Project, errorToThrow: any) {
  const mockDeclaration = {
    ...RenameTransformationTestHelper.createMockDeclaration(),
    getText: () => { throw errorToThrow; }
  };
  return new RenameVariableTransformation(mockDeclaration, [], 'newName');
}

describe('RenameVariableTransformation Core', () => {
  let project: Project;

  beforeEach(() => {
    project = new Project({ useInMemoryFileSystem: true });
  });

  describe('transform', () => {
    it('should successfully transform when rename succeeds', async () => {
      const helper = RenameTransformationTestHelper.create(project);
      const { sourceFile, transformation } = helper.createTransformationScenario({
        fileName: 'test.ts',
        sourceCode: `
        const oldName = 42;
        console.log(oldName);
      `,
        oldName: 'oldName',
        newName: 'newName'
      });

      await expect(transformation.transform(sourceFile)).resolves.not.toThrow();
      expect(sourceFile.getText()).toContain('newName');
    });

    it('should throw error when rename fails', async () => {
      const sourceFile = project.createSourceFile('test.ts', `
        const oldName = 42;
      `);

      const mockDeclaration = createMockDeclarationThatThrowsError();

      const transformation = new RenameVariableTransformation(mockDeclaration, [], 'newName');

      await expect(transformation.transform(sourceFile)).rejects.toThrow('Mock error');
    });

    it('should throw error with default message when no error message provided', async () => {
      const sourceFile = project.createSourceFile('test.ts', `
        const oldName = 42;
      `);

      const mockDeclaration = createMockDeclarationForUnsuccessfulResult();

      const transformation = new RenameVariableTransformation(mockDeclaration, [], 'newName');

      jest.spyOn(transformation, 'transformWithResult').mockResolvedValue({
        success: false,
        changesCount: 0
      });

      await expect(transformation.transform(sourceFile)).rejects.toThrow('Rename transformation failed');
    });
  });

  describe('transformWithResult', () => {
    it('should return success result when rename works', async () => {
      const helper = RenameTransformationTestHelper.create(project);
      const { transformation } = helper.createTransformationScenario({
        fileName: 'test.ts',
        sourceCode: `
        const oldName = 42;
        console.log(oldName);
      `,
        oldName: 'oldName',
        newName: 'newName'
      });

      const result = await transformation.transformWithResult();

      expect(result.success).toBe(true);
      expect(result.changesCount).toBe(2);
      expect(result.message).toContain("Renamed 2 occurrences of 'oldName = 42' to 'newName'");
    });

    it('should return error result when exception occurs', async () => {
      const transformation = createErrorMockTransformation(project, new Error('Test error'));
      const result = await transformation.transformWithResult();

      verify(__dirname, 'error-exception', JSON.stringify(result, null, 2), { reporters: ['donothing'] });
    });

    it('should handle unknown error types', async () => {
      const transformation = createErrorMockTransformation(project, 'String error');
      const result = await transformation.transformWithResult();

      verify(__dirname, 'error-unknown-type', JSON.stringify(result, null, 2), { reporters: ['donothing'] });
    });
  });
});