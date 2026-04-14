import { CommandResult } from './command-result';

export interface MoveFileResultData extends CommandResult {
  type: 'move-file';
  movedFrom: string;
  movedTo: string;
  referencingFiles: string[];
  sameLocation: boolean;
}

export class MoveFileCommandResult implements MoveFileResultData {
  type: 'move-file' = 'move-file';

  constructor(
    public movedFrom: string,
    public movedTo: string,
    public referencingFiles: string[],
    public sameLocation = false
  ) {}
}
