import { CommandResult } from './command-result';

/**
 * Result for refactoring commands that modify code (extract, inline, rename, sort-methods, move-method).
 * These commands modify the file system and don't need additional output data.
 */
export interface RefactoringResultData extends CommandResult {
  type: 'refactoring';
  message?: string;
}

export class RefactoringCommandResult implements RefactoringResultData {
  type: 'refactoring' = 'refactoring';

  constructor(public message?: string) {}
}
