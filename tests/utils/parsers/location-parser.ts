import {SourceLocation} from "../../../src/core/ast/location-range";

export interface LocationInfo {
  file: string;
  start: { line: number; column: number };
  end: { line: number; column: number };
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
      start: LocationParser.makeSourceLocation(match[2], match[3]),
      end: LocationParser.makeSourceLocation(match[4],match[5])
    };
  }

  private static makeSourceLocation(line: string, column: string) : SourceLocation {
    return {
      line: parseInt(line, 10),
      column: parseInt(column, 10)
    };
  }
}