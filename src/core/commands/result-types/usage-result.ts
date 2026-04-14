import { CommandResult } from './command-result';
import { UsageLocation, LocationRange } from '../../ast/location-range';

export interface UsageResultData extends CommandResult {
  type: 'usage';
  usages: UsageLocation[];
  targetLocation: LocationRange;
}

export class UsageResult implements UsageResultData {
  type: 'usage' = 'usage';

  constructor(
    public usages: UsageLocation[],
    public targetLocation: LocationRange
  ) {}
}
