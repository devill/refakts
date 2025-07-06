import { ASTService } from '../../../src/services/ast-service';
import { LocationRange } from '../../../src/core/location-parser';
import { Project } from 'ts-morph';

describe('ASTService', () => {
  let astService: ASTService;
  let project: Project;

  beforeEach(() => {
    project = new Project({ useInMemoryFileSystem: true });
    astService = new ASTService(project);
  });

  describe('findNodeByLocation', () => {
    it('should throw error when no node found at position', () => {
      const tempFilePath = '/test-file.ts';
      const sourceCode = 'const x = 42;';
      project.createSourceFile(tempFilePath, sourceCode);

      const location: LocationRange = {
        file: tempFilePath,
        startLine: 10,
        startColumn: 1,
        endLine: 10,
        endColumn: 5
      };

      expect(() => {
        astService.findNodeByLocation(location);
      }).toThrow('No node found at position 10:1');
    });

    it('should throw error when position is out of bounds', () => {
      const tempFilePath = '/test-file2.ts';
      const sourceCode = 'const x = 42;';
      project.createSourceFile(tempFilePath, sourceCode);

      const location: LocationRange = {
        file: tempFilePath,
        startLine: 1,
        startColumn: 100,
        endLine: 1,
        endColumn: 105
      };

      expect(() => {
        astService.findNodeByLocation(location);
      }).toThrow('No node found at position 1:100');
    });
  });
});