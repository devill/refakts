import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { MoveFileService } from '../../../src/core/transformations/move-file-service';
import { ImportReferenceService } from '../../../src/core/services/import-reference-service';

describe('MoveFileService', () => {
  let scratchDir: string;
  let sourcePath: string;
  let destinationPath: string;

  beforeEach(() => {
    scratchDir = fs.mkdtempSync(path.join(os.tmpdir(), 'move-file-service-'));
    sourcePath = path.join(scratchDir, 'source.ts');
    destinationPath = path.join(scratchDir, 'moved.ts');
    fs.writeFileSync(sourcePath, 'export const value = 1;\n');
  });

  afterEach(() => {
    fs.rmSync(scratchDir, { recursive: true, force: true });
  });

  it('rejects and leaves the file unmoved when reference collection throws', async () => {
    const failingReferenceService = {
      findReferencingFiles: jest.fn().mockRejectedValue(new Error('scan failed'))
    } as unknown as ImportReferenceService;
    const service = new MoveFileService(failingReferenceService);

    await expect(service.moveFile({ sourcePath, destinationPath })).rejects.toThrow('scan failed');
    expect(fs.existsSync(sourcePath)).toBe(true);
    expect(fs.existsSync(destinationPath)).toBe(false);
  });
});
