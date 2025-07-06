import * as fs from 'fs';

jest.mock('fs');
jest.mock('os', () => ({
  homedir: jest.fn().mockReturnValue('/home/user')
}));

import { UsageTracker } from '../../src/usage-tracker';

describe('UsageTracker', () => {
  const mockedFs = fs as jest.Mocked<typeof fs>;
  const mockLogFile = '/home/user/.refakts-usage.jsonl';


  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('logUsage', () => {
    it('should handle file write errors gracefully', () => {
      mockedFs.appendFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      expect(() => {
        UsageTracker.logUsage('test-command', ['--option']);
      }).not.toThrow();

      expect(console.warn).toHaveBeenCalledWith('Failed to write usage log:', expect.any(Error));
    });
  });

  describe('getUsageLog', () => {
    it('should handle malformed JSON lines gracefully', () => {
      const malformedContent = '{"command":"test1","timestamp":"2023-01-01T00:00:00.000Z","args":[]}\n' +
                              'invalid json line\n' +
                              '{"command":"test2","timestamp":"2023-01-01T00:00:00.000Z","args":[]}';
      
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(malformedContent);

      const result = UsageTracker.getUsageLog();

      expect(result).toHaveLength(2);
      expect(result[0].command).toBe('test1');
      expect(result[1].command).toBe('test2');
      expect(console.warn).toHaveBeenCalledWith(
        'Failed to parse usage log line:', 
        'invalid json line', 
        expect.any(Error)
      );
    });

    it('should return empty array when file does not exist', () => {
      mockedFs.existsSync.mockReturnValue(false);

      const result = UsageTracker.getUsageLog();

      expect(result).toEqual([]);
    });

    it('should handle file read errors gracefully', () => {
      mockedFs.readFileSync.mockImplementation(() => {
        throw new Error('File read error');
      });

      const result = UsageTracker.getUsageLog();

      expect(result).toEqual([]);
    });
  });

  describe('clearUsageLog', () => {
    it('should handle file deletion errors gracefully', () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.unlinkSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      expect(() => {
        UsageTracker.clearUsageLog();
      }).not.toThrow();

      expect(console.warn).toHaveBeenCalledWith('Failed to clear usage log:', expect.any(Error));
    });

    it('should not error when file does not exist', () => {
      mockedFs.existsSync.mockReturnValue(false);

      expect(() => {
        UsageTracker.clearUsageLog();
      }).not.toThrow();

      expect(mockedFs.unlinkSync).not.toHaveBeenCalled();
    });
  });

  describe('filterPrivateArgs', () => {
    it('should filter out file paths and absolute paths', () => {
      mockedFs.appendFileSync.mockImplementation(() => {});
      
      UsageTracker.logUsage('test-command', [
        'normal-arg',
        '/absolute/path',
        'relative/path',
        '--option',
        'value'
      ]);

      expect(mockedFs.appendFileSync).toHaveBeenCalledWith(
        mockLogFile,
        expect.stringContaining('"args":["normal-arg","--option","value"]')
      );
    });
  });
});