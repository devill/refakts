import { RenameVariableTransformation } from '../../../src/core/transformations/rename-variable-transformation';
import { Project, SyntaxKind } from 'ts-morph';
import { RenameTransformationTestHelper } from '../../utils/rename-transformation-test-helper';
import { verify } from 'approvals';

describe('RenameVariableTransformation', () => {
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

      // Create a mock declaration that will cause failure
      const mockDeclaration = {
        getText: () => { throw new Error('Mock error'); },
        getKind: () => SyntaxKind.VariableDeclaration,
        getFirstDescendantByKind: () => undefined
      } as any;

      const transformation = new RenameVariableTransformation(mockDeclaration, [], 'newName');

      await expect(transformation.transform(sourceFile)).rejects.toThrow('Mock error');
    });

    it('should throw error with default message when no error message provided', async () => {
      const sourceFile = project.createSourceFile('test.ts', `
        const oldName = 42;
      `);

      // Create a mock that returns unsuccessful result without message
      const mockDeclaration = {
        getText: () => 'oldName',
        getKind: () => SyntaxKind.VariableDeclaration,
        getFirstDescendantByKind: () => undefined
      } as any;

      const transformation = new RenameVariableTransformation(mockDeclaration, [], 'newName');

      // Override transformWithResult to return failure without message
      jest.spyOn(transformation, 'transformWithResult').mockResolvedValue({
        success: false,
        changesCount: 0
      });

      await expect(transformation.transform(sourceFile)).rejects.toThrow('Rename transformation failed');
    });
  });

  describe('transformWithResult', () => {
    const createErrorMockTransformation = (errorToThrow: any) => {
      const mockDeclaration = {
        ...RenameTransformationTestHelper.createMockDeclaration(),
        getText: () => { throw errorToThrow; }
      };
      return new RenameVariableTransformation(mockDeclaration, [], 'newName');
    };

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
      expect(result.changesCount).toBe(2); // declaration + 1 usage
      expect(result.message).toContain("Renamed 2 occurrences of 'oldName = 42' to 'newName'");
    });

    it('should return error result when exception occurs', async () => {
      const transformation = createErrorMockTransformation(new Error('Test error'));
      const result = await transformation.transformWithResult();

      verify(__dirname, 'error-exception', JSON.stringify(result, null, 2), { reporters: ['donothing'] });
    });

    it('should handle unknown error types', async () => {
      const transformation = createErrorMockTransformation('String error'); // Non-Error object
      const result = await transformation.transformWithResult();

      verify(__dirname, 'error-unknown-type', JSON.stringify(result, null, 2), { reporters: ['donothing'] });
    });
  });

  describe('renameDeclaration', () => {
    it('should return 0 when no identifier found in declaration', async () => {
      project.createSourceFile('test.ts', `
        const oldName = 42;
      `);

      // Create mock node that doesn't have identifier
      const mockDeclaration = {
        getText: () => 'mockText',
        getKind: () => SyntaxKind.Block, // Not an identifier
        getFirstDescendantByKind: () => undefined // No identifier descendant
      } as any;

      const transformation = new RenameVariableTransformation(mockDeclaration, [], 'newName');

      const result = await transformation.transformWithResult();

      expect(result.success).toBe(true);
      expect(result.changesCount).toBe(0); // No declaration renamed
    });
  });

  describe('renameUsages', () => {
    it('should return 0 when no usages have identifiers', async () => {
      const sourceFile = project.createSourceFile('test.ts', `
        const oldName = 42;
      `);

      const declaration = sourceFile.getVariableDeclarations()[0];

      // Create mock usage nodes without identifiers
      const mockUsage1 = {
        getKind: () => SyntaxKind.Block,
        getFirstDescendantByKind: () => undefined
      } as any;

      const mockUsage2 = {
        getKind: () => SyntaxKind.Block,
        getFirstDescendantByKind: () => undefined
      } as any;

      const transformation = new RenameVariableTransformation(declaration, [mockUsage1, mockUsage2], 'newName');

      const result = await transformation.transformWithResult();

      expect(result.success).toBe(true);
      expect(result.changesCount).toBe(1); // Only declaration renamed, no usages
    });

    it('should handle partial success with some usages without identifiers', async () => {
      const sourceFile = project.createSourceFile('test.ts', `
        const oldName = 42;
        console.log(oldName);
      `);

      const declaration = sourceFile.getVariableDeclarations()[0];
      const realUsage = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)
        .find(id => id.getText() === 'oldName' && id !== declaration.getNameNode());

      // Mix real usage with mock usage without identifier
      const mockUsage = {
        getKind: () => SyntaxKind.Block,
        getFirstDescendantByKind: () => undefined
      } as any;

      const transformation = new RenameVariableTransformation(declaration, [realUsage!, mockUsage], 'newName');

      const result = await transformation.transformWithResult();

      expect(result.success).toBe(true);
      expect(result.changesCount).toBe(2); // Declaration + 1 real usage (mock usage failed)
    });
  });

  describe('findIdentifierInNode', () => {
    it('should return node itself when it is an identifier', () => {
      const sourceFile = project.createSourceFile('test.ts', `const test = 42;`);
      const identifier = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)[0];

      const transformation = new RenameVariableTransformation(identifier, [], 'newName');

      // Access private method through any cast for testing
      const result = (transformation as any).findIdentifierInNode(identifier);

      expect(result).toBe(identifier);
    });

    it('should return undefined when node has no identifier descendant', () => {
      const sourceFile = project.createSourceFile('test.ts', `const test = 42;`);
      const blockNode = sourceFile.getStatements()[0]; // Statement node

      const transformation = new RenameVariableTransformation(blockNode, [], 'newName');

      // Mock getFirstDescendantByKind to return undefined
      jest.spyOn(blockNode, 'getFirstDescendantByKind').mockReturnValue(undefined);
      jest.spyOn(blockNode, 'getKind').mockReturnValue(SyntaxKind.Block);

      const result = (transformation as any).findIdentifierInNode(blockNode);

      expect(result).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    const createTestTransformation = (sourceCode: string) => {
      const sourceFile = project.createSourceFile('test.ts', sourceCode);
      const declaration = sourceFile.getVariableDeclarations()[0];
      return new RenameVariableTransformation(declaration, [], 'newName');
    };

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
});