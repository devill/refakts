import { ConsoleOutput } from './console-output';
import { CommandOptions } from '../../core/commands/command';
import { UsageResult } from '../../core/commands/result-types/usage-result';
import { SelectCommandResult } from '../../core/commands/result-types/select-result';
import { RefactoringCommandResult } from '../../core/commands/result-types/refactoring-result';
import { MoveFileCommandResult } from '../../core/commands/result-types/move-file-result';
import { UsageOutputHandler } from './usage-output-handler';
import { SelectOutputHandler } from './selection-output-handler';
import * as path from 'path';

export class CommandOutputFormatter {
  private usageOutputHandler: UsageOutputHandler;
  private selectOutputHandler: SelectOutputHandler;

  constructor(private consoleOutput: ConsoleOutput) {
    this.usageOutputHandler = new UsageOutputHandler(consoleOutput);
    this.selectOutputHandler = new SelectOutputHandler(consoleOutput);
  }

  formatResult(result: unknown, options?: CommandOptions): void {
    if (!result) return;
    if (this.tryFormatUsageResult(result, options)) return;
    if (this.tryFormatSelectResult(result)) return;
    if (this.tryFormatMoveFileResult(result)) return;
    this.tryFormatRefactoringResult(result);
  }

  private tryFormatUsageResult(result: unknown, options?: CommandOptions): boolean {
    if (!this.isUsageResult(result)) return false;
    this.usageOutputHandler.outputUsages({
      usages: result.usages,
      baseDir: process.cwd(),
      targetLocation: result.targetLocation,
      options
    });
    return true;
  }

  private tryFormatSelectResult(result: unknown): boolean {
    if (!this.isSelectResult(result)) return false;
    this.selectOutputHandler.outputResults(result.results);
    return true;
  }

  private tryFormatMoveFileResult(result: unknown): boolean {
    if (!this.isMoveFileResult(result)) return false;
    if ((result as MoveFileCommandResult).sameLocation) {
      this.consoleOutput.write(`File is already at the target location: ${result.movedFrom}`);
      return true;
    }
    this.consoleOutput.write(`File moved: ${result.movedFrom} → ${result.movedTo}\n`);
    this.outputFilesList(result.referencingFiles);
    return true;
  }

  private outputFilesList(files: string[]): void {
    if (files.length === 0) {
      this.consoleOutput.write('No import references found to update\n');
      return;
    }
    this.consoleOutput.write('Updated imports in:\n');
    files.forEach(file => {
      this.consoleOutput.write(`  - ${this.getRelativePath(file)}\n`);
    });
  }

  private getRelativePath(filePath: string): string {
    return path.relative(process.cwd(), filePath);
  }

  private tryFormatRefactoringResult(result: unknown): boolean {
    if (!this.isRefactoringResult(result)) return false;
    if ((result as RefactoringCommandResult).message) {
      this.consoleOutput.write((result as RefactoringCommandResult).message + '\n');
    }
    return true;
  }

  private isUsageResult(result: unknown): result is UsageResult {
    return this.hasType(result, 'usage');
  }

  private isSelectResult(result: unknown): result is SelectCommandResult {
    return this.hasType(result, 'select');
  }

  private isMoveFileResult(result: unknown): result is MoveFileCommandResult {
    return this.hasType(result, 'move-file');
  }

  private isRefactoringResult(result: unknown): result is RefactoringCommandResult {
    return this.hasType(result, 'refactoring');
  }

  private hasType(result: unknown, type: string): result is Record<string, unknown> {
    return (
      typeof result === 'object' &&
      result !== null &&
      (result as Record<string, unknown>).type === type
    );
  }
}
