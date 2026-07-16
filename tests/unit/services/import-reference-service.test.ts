import { describe, it, expect } from '@jest/globals';
import { ImportReferenceService } from '../../../src/core/services/import-reference-service';
import { ASTService } from '../../../src/core/ast/ast-service';

describe('ImportReferenceService', () => {
  describe('findReferencingFiles', () => {
    it('propagates when the project scan throws', async () => {
      const astService = {
        getProject: jest.fn(() => { throw new Error('scan boom'); })
      } as unknown as ASTService;
      const service = new ImportReferenceService(astService);

      await expect(service.findReferencingFiles('/project/source.ts'))
        .rejects.toThrow('Failed to scan project references for /project/source.ts: scan boom');
    });
  });

  describe('checkFileImportsFrom', () => {
    it('propagates when loadSourceFile throws', () => {
      const astService = {
        loadSourceFile: jest.fn(() => { throw new Error('load boom'); })
      } as unknown as ASTService;
      const service = new ImportReferenceService(astService);

      expect(() => service.checkFileImportsFrom('/project/source.ts', '/project/target.ts'))
        .toThrow('Failed to check imports from /project/source.ts: load boom');
    });
  });
});
