import { ASTService } from '../../../src/core/ast/ast-service';
import { LocationRange } from '../../../src/core/ast/location-range';
import { Project } from 'ts-morph';

describe('ASTService', () => {
  let astService: ASTService;
  let project: Project;

  beforeEach(() => {
    project = new Project({ useInMemoryFileSystem: true });
    astService = ASTService.createWithProject(project);
  });

  describe('findNodeByLocation', () => {
    it('should throw error when no node found at position', () => {
      const tempFilePath = '/test-file.ts';
      const sourceCode = 'const x = 42;';
      project.createSourceFile(tempFilePath, sourceCode);

      const location = new LocationRange(tempFilePath, { line: 10, column: 1 }, { line: 10, column: 5 });

      expect(() => {
        astService.findNodeByLocation(location);
      }).toThrow('No node found at position 10:1');
    });

    it('should throw error when position is out of bounds', () => {
      const tempFilePath = '/test-file2.ts';
      const sourceCode = 'const x = 42;';
      project.createSourceFile(tempFilePath, sourceCode);

      const location = new LocationRange(tempFilePath, { line: 1, column: 100 }, { line: 1, column: 105 });

      expect(() => {
        astService.findNodeByLocation(location);
      }).toThrow('No node found at position 1:100');
    });
  });
});