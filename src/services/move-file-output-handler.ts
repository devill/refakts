import { ConsoleOutput } from '../interfaces/ConsoleOutput';
import { MoveFileResult } from '../core/transformations/move-file-service';
import * as path from 'path';

export class MoveFileOutputHandler {
  private consoleOutput: ConsoleOutput;
  
  constructor(consoleOutput: ConsoleOutput) {
    this.consoleOutput = consoleOutput;
  }

  outputResult(result: MoveFileResult): void {
    if (result.sameLocation) {
      this.outputSameLocationMessage(result.sourcePath);
      return;
    }
    
    this.outputMoveSuccess(result.sourcePath, result.destinationPath, result.referencingFiles);
  }

  private outputSameLocationMessage(sourcePath: string): void {
    this.consoleOutput.write(`File is already at the target location: ${sourcePath}\n`);
  }

  private outputMoveSuccess(sourcePath: string, destinationPath: string, referencingFiles: string[]): void {
    this.consoleOutput.write(`File moved: ${sourcePath} → ${destinationPath}\n`);
    this.outputImportUpdateSummary(referencingFiles);
  }

  private outputImportUpdateSummary(referencingFiles: string[]): void {
    if (referencingFiles.length === 0) {
      this.consoleOutput.write('No import references found to update\n');
      return;
    }
    
    this.consoleOutput.write('Updated imports in:\n');
    referencingFiles.forEach(file => {
      const relativePath = this.getRelativePath(file);
      this.consoleOutput.write(`  - ${relativePath}\n`);
    });
  }

  private getRelativePath(filePath: string): string {
    return path.relative(process.cwd(), filePath);
  }
}