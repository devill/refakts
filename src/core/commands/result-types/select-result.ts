import { CommandResult } from './command-result';
import { SelectResult } from '../../services/selection/selection-types';

export interface SelectResultData extends CommandResult {
  type: 'select';
  results: SelectResult[];
}

export class SelectCommandResult implements SelectResultData {
  type: 'select' = 'select';

  constructor(public results: SelectResult[]) {}
}
