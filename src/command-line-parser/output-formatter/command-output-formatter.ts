import { ConsoleOutput } from './console-output';
import { CommandOptions } from '../../core/commands/command';
import { UsageResult } from '../../core/commands/result-types/usage-result';
import { SelectCommandResult } from '../../core/commands/result-types/select-result';
import { RefactoringCommandResult } from '../../core/commands/result-types/refactoring-result';
import { MoveFileCommandResult } from '../../core/commands/result-types/move-file-result';
import { UsageOutputHandler } from './usage-output-handler';
import { SelectOutputHandler } from './selection-output-handler';

/**
 * Routes command results to appropriate output handlers.
 * This separates output formatting from command logic.
 */
export class CommandOutputFormatter {
  private usageOutputHandler: UsageOutputHandler;
  private selectOutputHandler: SelectOutputHandler;

  constructor(private consoleOutput: ConsoleOutput) {
    this.usageOutputHandler = new UsageOutputHandler(consoleOutput);
    this.selectOutputHandler = new SelectOutputHandler(consoleOutput);
  }

  formatResult(result: unknown, options?: CommandOptions): void {
    if (!result) {
      return;
    }

    if (this.isUsageResult(result)) {
      this.usageOutputHandler.outputUsages({
        usages: result.usages,
        baseDir: process.cwd(),
        targetLocation: result.targetLocation,
        options
      });
    } else if (this.isSelectResult(result)) {
      this.selectOutputHandler.outputResults(result.results);
    } else if (this.isMoveFileResult(result)) {
      this.outputMoveFileResult(result);
    } else if (this.isRefactoringResult(result)) {
      if (result.message) {
        this.consoleOutput.write(result.message);
      }
    }
  }

  private outputMoveFileResult(result: MoveFileCommandResult): void {
    this.consoleOutput.write(`File moved: ${result.movedFrom} → ${result.movedTo}\n`);
    this.consoleOutput.write(`Updated imports in ${result.referencesUpdated} file(s)\n`);
  }

  private isUsageResult(result: unknown): result is UsageResult {
    return (
      typeof result === 'object' &&
      result !== null &&
      (result as Record<string, unknown>).type === 'usage'
    );
  }

  private isSelectResult(result: unknown): result is SelectCommandResult {
    return (
      typeof result === 'object' &&
      result !== null &&
      (result as Record<string, unknown>).type === 'select'
    );
  }

  private isMoveFileResult(result: unknown): result is MoveFileCommandResult {
    return (
      typeof result === 'object' &&
      result !== null &&
      (result as Record<string, unknown>).type === 'move-file'
    );
  }

  private isRefactoringResult(result: unknown): result is RefactoringCommandResult {
    return (
      typeof result === 'object' &&
      result !== null &&
      (result as Record<string, unknown>).type === 'refactoring'
    );
  }
}
