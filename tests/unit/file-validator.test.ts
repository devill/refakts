import { describe, it, expect, beforeEach } from '@jest/globals';
import { FileValidator, FileSystemWrapper } from '../../src/services/file-validator';
import { ASTService } from '../../src/core/ast/ast-service';

describe('FileValidator', () => {
  let fileValidator: FileValidator;
  let mockFileSystem: jest.Mocked<FileSystemWrapper>;
  let mockASTService: jest.Mocked<ASTService>;

  beforeEach(() => {
    mockFileSystem = {
      existsSync: jest.fn()
    };
    
    mockASTService = {
      loadSourceFile: jest.fn()
    } as any;
    
    fileValidator = new FileValidator(mockASTService, mockFileSystem);
  });

  describe('validateSourceFile', () => {
    it('should throw error when source file does not exist', () => {
      mockFileSystem.existsSync.mockReturnValue(false);
      
      expect(() => fileValidator.validateSourceFile('/nonexistent/file.ts'))
        .toThrow('Source file does not exist: /nonexistent/file.ts');
    });

    it('should throw permission error when file cannot be read', () => {
      mockFileSystem.existsSync.mockReturnValue(true);
      mockASTService.loadSourceFile.mockImplementation(() => {
        throw new Error('Permission denied: Cannot read file /test/source.ts');
      });
      
      expect(() => fileValidator.validateSourceFile('/test/source.ts'))
        .toThrow('Permission denied: Cannot read file /test/source.ts');
    });

    it('should throw syntax error when file has syntax errors', () => {
      mockFileSystem.existsSync.mockReturnValue(true);
      const mockSourceFile = {
        getPreEmitDiagnostics: jest.fn().mockReturnValue([
          { getMessageText: () => 'Unexpected token', getCode: () => 1000 }
        ])
      } as any;
      mockASTService.loadSourceFile.mockReturnValue(mockSourceFile);
      
      expect(() => fileValidator.validateSourceFile('test/source.ts'))
        .toThrow('Syntax errors detected in test/source.ts');
    });

    it('should pass when file exists and has valid syntax', () => {
      mockFileSystem.existsSync.mockReturnValue(true);
      const mockSourceFile = {
        getPreEmitDiagnostics: jest.fn().mockReturnValue([])
      } as any;
      mockASTService.loadSourceFile.mockReturnValue(mockSourceFile);
      
      expect(() => fileValidator.validateSourceFile('/test/source.ts')).not.toThrow();
    });

    it('should ignore common non-critical diagnostics', () => {
      mockFileSystem.existsSync.mockReturnValue(true);
      const mockSourceFile = {
        getPreEmitDiagnostics: jest.fn().mockReturnValue([
          { getMessageText: () => 'Cannot find module', getCode: () => 2307 },
          { getMessageText: () => 'Invalid module name in augmentation', getCode: () => 2664 },
          { getMessageText: () => 'Cannot find name \'console\'', getCode: () => 2304 }
        ])
      } as any;
      mockASTService.loadSourceFile.mockReturnValue(mockSourceFile);
      
      expect(() => fileValidator.validateSourceFile('/test/source.ts')).not.toThrow();
    });
  });

  describe('validateDestinationFile', () => {
    it('should throw error when destination file already exists', () => {
      mockFileSystem.existsSync.mockReturnValue(true);
      
      expect(() => fileValidator.validateDestinationFile('test/destination.ts'))
        .toThrow('Cannot move file to test/destination.ts - file already exists');
    });

    it('should pass when destination file does not exist', () => {
      mockFileSystem.existsSync.mockReturnValue(false);
      
      expect(() => fileValidator.validateDestinationFile('/test/destination.ts')).not.toThrow();
    });
  });
});