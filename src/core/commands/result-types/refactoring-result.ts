import { CommandResult } from './command-result';

export interface RefactoringResultData extends CommandResult {
  type: 'refactoring';
  message?: string;
}

export class RefactoringCommandResult implements RefactoringResultData {
  type: 'refactoring' = 'refactoring';

  constructor(public message?: string) {}
}
