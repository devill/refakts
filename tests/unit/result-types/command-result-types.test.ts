import { UsageResult } from '../../../src/core/commands/result-types/usage-result';
import { SelectCommandResult } from '../../../src/core/commands/result-types/select-result';
import { RefactoringCommandResult } from '../../../src/core/commands/result-types/refactoring-result';
import { MoveFileCommandResult } from '../../../src/core/commands/result-types/move-file-result';
import { SelectResult } from '../../../src/core/services/selection/selection-types';
import { LocationRange } from '../../../src/core/ast/location-range';

describe('Command Result Types', () => {
  describe('UsageResult', () => {
    it('should create usage result with usages and target location', () => {
      const location = new LocationRange('test.ts', { line: 1, column: 0 }, { line: 1, column: 5 });
      const result = new UsageResult([], location);

      expect(result.type).toBe('usage');
      expect(result.usages).toEqual([]);
      expect(result.targetLocation).toBe(location);
    });
  });

  describe('SelectCommandResult', () => {
    it('should create select result with results array', () => {
      const selectResults = [new SelectResult('test.ts 1:0', 'content')];
      const result = new SelectCommandResult(selectResults);

      expect(result.type).toBe('select');
      expect(result.results).toEqual(selectResults);
    });
  });

  describe('RefactoringCommandResult', () => {
    it('should create refactoring result without message', () => {
      const result = new RefactoringCommandResult();

      expect(result.type).toBe('refactoring');
      expect(result.message).toBeUndefined();
    });

    it('should create refactoring result with message', () => {
      const message = 'Successfully completed refactoring';
      const result = new RefactoringCommandResult(message);

      expect(result.type).toBe('refactoring');
      expect(result.message).toBe(message);
    });
  });

  describe('MoveFileCommandResult', () => {
    it('should create move file result with file paths and count', () => {
      const files = ['src/main.ts', 'src/utils.ts'];
      const result = new MoveFileCommandResult('old.ts', 'new.ts', files);

      expect(result.type).toBe('move-file');
      expect(result.movedFrom).toBe('old.ts');
      expect(result.movedTo).toBe('new.ts');
      expect(result.referencingFiles).toEqual(files);
      expect(result.sameLocation).toBe(false);
    });

    it('should create move file result with sameLocation flag', () => {
      expect(new MoveFileCommandResult('same.ts', 'same.ts', [], true).sameLocation).toBe(true);
    });
  });
});
