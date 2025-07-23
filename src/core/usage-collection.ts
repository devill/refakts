import { UsageLocation, LocationRange } from './ast/location-range';

export class UsageCollection {
  constructor(
    private readonly _usages: UsageLocation[],
    private readonly _targetLocation: LocationRange
  ) {}

  get target(): LocationRange {
    return this._targetLocation;
  }

  get isEmpty(): boolean {
    return this._usages.length === 0;
  }

  get sorted(): UsageLocation[] {
    return this._usages.sort((a, b) => this.compareUsageLocations(a, b));
  }

  get declaration(): UsageLocation | undefined {
    return this._usages.find(usage => this.isTargetLocation(usage));
  }

  get otherUsages(): UsageLocation[] {
    return this.sorted.filter(usage => !this.isTargetLocation(usage));
  }

  get writeUsages(): UsageLocation[] {
    return this._usages.filter(usage => usage.usageType === 'write');
  }

  get readUsages(): UsageLocation[] {
    return this._usages.filter(usage => usage.usageType === 'read');
  }

  separateByType(): { writeUsages: UsageLocation[], readUsages: UsageLocation[] } {
    return {
      writeUsages: this.writeUsages,
      readUsages: this.readUsages
    };
  }

  private compareUsageLocations(a: UsageLocation, b: UsageLocation): number {
    const definitionComparison = this.compareByDefinitionPriority(a, b);
    if (definitionComparison !== 0) return definitionComparison;
    
    return this.compareByLocation(a, b);
  }

  private compareByDefinitionPriority(a: UsageLocation, b: UsageLocation): number {
    const aIsDefinition = this.isTargetLocation(a);
    const bIsDefinition = this.isTargetLocation(b);
    
    if (aIsDefinition && !bIsDefinition) return -1;
    if (!aIsDefinition && bIsDefinition) return 1;
    return 0;
  }

  private compareByLocation(a: UsageLocation, b: UsageLocation): number {
    return a.location.compareToLocation(b.location);
  }

  private isTargetLocation(usage: UsageLocation): boolean {
    return usage.location.matchesTarget(this._targetLocation.file, this._targetLocation.start.line);
  }
}