export interface LocationInfo {
  file: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export interface UsageLocation {
  location: LocationInfo;
  text: string;
}