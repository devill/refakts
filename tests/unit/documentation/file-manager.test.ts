import { FileManager } from '../../../src/dev/file-manager';
import * as fs from 'fs';

jest.mock('fs');

describe('FileManager', () => {
  let fileManager: FileManager;
  const mockedFs = fs as jest.Mocked<typeof fs>;

  beforeEach(() => {
    fileManager = new FileManager();
    jest.clearAllMocks();
  });

  describe('readFile', () => {
    it('should throw error when file does not exist', () => {
      const filePath = '/nonexistent/file.ts';
      mockedFs.existsSync.mockReturnValue(false);

      expect(() => {
        fileManager.readFile(filePath);
      }).toThrow(`File not found: ${filePath}`);
    });

    it('should read file successfully when it exists', () => {
      const filePath = '/existing/file.ts';
      const fileContent = 'const x = 42;';
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(fileContent);

      const result = fileManager.readFile(filePath);

      expect(result).toBe(fileContent);
      expect(mockedFs.readFileSync).toHaveBeenCalledWith(filePath, 'utf8');
    });
  });
});