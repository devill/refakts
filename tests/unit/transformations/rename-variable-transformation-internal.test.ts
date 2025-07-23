import { RenameVariableTransformation } from '../../../src/core/transformations/rename-variable-transformation';
import { Project, SyntaxKind } from 'ts-morph';

function createMockNodeWithoutIdentifier() {
  return {
    getText: () => 'mockText',
    getKind: () => SyntaxKind.Block,
    getFirstDescendantByKind: () => undefined
  } as any;
}

function createSingleMockUsageWithoutIdentifier() {
  return {
    getKind: () => SyntaxKind.Block,
    getFirstDescendantByKind: () => undefined
  } as any;
}

function createMockUsageNodesWithoutIdentifiers() {
  return [createSingleMockUsageWithoutIdentifier(), createSingleMockUsageWithoutIdentifier()];
}

function createMockUsageWithoutIdentifier() {
  return {
    getKind: () => SyntaxKind.Block,
    getFirstDescendantByKind: () => undefined
  } as any;
}

describe('RenameVariableTransformation Internal Methods', () => {
  let project: Project;

  beforeEach(() => {
    project = new Project({ useInMemoryFileSystem: true });
  });

  describe('renameDeclaration', () => {
    it('should return 0 when no identifier found in declaration', async () => {
      project.createSourceFile('test.ts', `
        const oldName = 42;
      `);

      const mockDeclaration = createMockNodeWithoutIdentifier();

      const transformation = new RenameVariableTransformation(mockDeclaration, [], 'newName');

      const result = await transformation.transformWithResult();

      expect(result.success).toBe(true);
      expect(result.changesCount).toBe(0);
    });
  });

  describe('renameUsages', () => {
    it('should return 0 when no usages have identifiers', async () => {
      const sourceFile = project.createSourceFile('test.ts', `
        const oldName = 42;
      `);

      const declaration = sourceFile.getVariableDeclarations()[0];

      const [mockUsage1, mockUsage2] = createMockUsageNodesWithoutIdentifiers();

      const transformation = new RenameVariableTransformation(declaration, [mockUsage1, mockUsage2], 'newName');

      const result = await transformation.transformWithResult();

      expect(result.success).toBe(true);
      expect(result.changesCount).toBe(1);
    });

    it('should handle partial success with some usages without identifiers', async () => {
      const sourceFile = project.createSourceFile('test.ts', `
        const oldName = 42;
        console.log(oldName);
      `);

      const declaration = sourceFile.getVariableDeclarations()[0];
      const realUsage = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)
        .find(id => id.getText() === 'oldName' && id !== declaration.getNameNode());

      const mockUsage = createMockUsageWithoutIdentifier();

      const transformation = new RenameVariableTransformation(declaration, [realUsage!, mockUsage], 'newName');

      const result = await transformation.transformWithResult();

      expect(result.success).toBe(true);
      expect(result.changesCount).toBe(2);
    });
  });

  describe('findIdentifierInNode', () => {
    it('should return node itself when it is an identifier', () => {
      const sourceFile = project.createSourceFile('test.ts', `const test = 42;`);
      const identifier = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)[0];

      const transformation = new RenameVariableTransformation(identifier, [], 'newName');

      const result = (transformation as any).findIdentifierInNode(identifier);

      expect(result).toBe(identifier);
    });

    it('should return undefined when node has no identifier descendant', () => {
      const sourceFile = project.createSourceFile('test.ts', `const test = 42;`);
      const blockNode = sourceFile.getStatements()[0];

      const transformation = new RenameVariableTransformation(blockNode, [], 'newName');

      jest.spyOn(blockNode, 'getFirstDescendantByKind').mockReturnValue(undefined);
      jest.spyOn(blockNode, 'getKind').mockReturnValue(SyntaxKind.Block);

      const result = (transformation as any).findIdentifierInNode(blockNode);

      expect(result).toBeUndefined();
    });
  });
});