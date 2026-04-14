import { CommandOutputFormatter } from '../../../src/command-line-parser/output-formatter/command-output-formatter';
import { ConsoleCapture } from '../../utils/console-capture';
import { UsageResult } from '../../../src/core/commands/result-types/usage-result';
import { SelectCommandResult } from '../../../src/core/commands/result-types/select-result';
import { RefactoringCommandResult } from '../../../src/core/commands/result-types/refactoring-result';
import { MoveFileCommandResult } from '../../../src/core/commands/result-types/move-file-result';
import { SelectResult } from '../../../src/core/services/selection/selection-types';
import { LocationRange } from '../../../src/core/ast/location-range';

describe('CommandOutputFormatter', () => {
  let consoleOutput: ConsoleCapture;
  let formatter: CommandOutputFormatter;

  beforeEach(() => {
    consoleOutput = new ConsoleCapture();
    formatter = new CommandOutputFormatter(consoleOutput);
  });

  it('should handle null/undefined results gracefully', () => {
    formatter.formatResult(null);
    formatter.formatResult(undefined);
    expect(consoleOutput.getOutput()).toBe('');
  });

  describe('UsageResult formatting', () => {
    it('should format usage result with multiple usages', () => {
      const location = new LocationRange('test.ts', { line: 1, column: 0 }, { line: 1, column: 5 });
      const result = new UsageResult([], location);

      formatter.formatResult(result);

      expect(consoleOutput.getOutput()).toContain('Symbol not found at specified location');
    });
  });

  describe('SelectCommandResult formatting', () => {
    it('should format select result with results', () => {
      const selectResults = [
        new SelectResult('test.ts 1:0', 'const x = 5'),
        new SelectResult('test.ts 2:0', 'const y = 10')
      ];
      const result = new SelectCommandResult(selectResults);

      formatter.formatResult(result);

      const output = consoleOutput.getOutput();
      expect(output).toContain('test.ts 1:0');
      expect(output).toContain('test.ts 2:0');
    });
  });

  describe('RefactoringCommandResult formatting', () => {
    it('should format refactoring result without message', () => {
      const result = new RefactoringCommandResult();

      formatter.formatResult(result);

      expect(consoleOutput.getOutput()).toBe('');
    });

    it('should format refactoring result with message', () => {
      const message = 'Successfully completed refactoring';
      const result = new RefactoringCommandResult(message);

      formatter.formatResult(result);

      expect(consoleOutput.getOutput()).toContain(message);
    });
  });

  describe('MoveFileCommandResult formatting', () => {
    it('should format move file result with files updated', () => {
      const files = ['src/main.ts', 'src/utils.ts'];
      const result = new MoveFileCommandResult('old.ts', 'new.ts', files);

      formatter.formatResult(result);

      const output = consoleOutput.getOutput();
      expect(output).toContain('File moved: old.ts → new.ts');
      expect(output).toContain('Updated imports in:');
      expect(output).toContain('src/main.ts');
      expect(output).toContain('src/utils.ts');
    });

    it('should format move file result with no files updated', () => {
      const result = new MoveFileCommandResult('old.ts', 'new.ts', []);

      formatter.formatResult(result);

      const output = consoleOutput.getOutput();
      expect(output).toContain('File moved: old.ts → new.ts');
      expect(output).toContain('No import references found to update');
    });

    it('should format move file result when same location', () => {
      const result = new MoveFileCommandResult('same.ts', 'same.ts', [], true);

      formatter.formatResult(result);

      expect(consoleOutput.getOutput()).toContain('File is already at the target location: same.ts');
    });
  });
});
