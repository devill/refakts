export interface LocationInfo {
  file: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export interface LocationParseResult {
  file: string;
  location?: LocationInfo;
}

export class LocationParser {
  parse(target: string): LocationParseResult {
    if (this.isLocationFormat(target)) {
      return this.parseLocationFormat(target);
    }
    return { file: target };
  }

  private isLocationFormat(target: string): boolean {
    return target.startsWith('[') && target.endsWith(']');
  }

  private parseLocationFormat(target: string): LocationParseResult {
    const file = this.extractFileFromLocationTarget(target);
    const location = this.extractLocationFromTarget(target);
    
    return { file, location };
  }

  private extractFileFromLocationTarget(target: string): string {
    const locationMatch = target.match(/^\[([^\]]+)\s+/);
    if (!locationMatch) {
      throw new Error(`Invalid location format: ${target}`);
    }
    return locationMatch[1];
  }

  private extractLocationFromTarget(target: string): LocationInfo | undefined {
    const locationRegex = /^\[([^\]]+)\s+(\d+):(\d+)-(\d+):(\d+)\]$/;
    const match = target.match(locationRegex);
    
    if (match) {
      return this.createLocationObject(match);
    }
    return undefined;
  }

  private createLocationObject(match: RegExpMatchArray): LocationInfo {
    return {
      file: match[1],
      startLine: parseInt(match[2], 10),
      startColumn: parseInt(match[3], 10),
      endLine: parseInt(match[4], 10),
      endColumn: parseInt(match[5], 10)
    };
  }
}