import { SectionReplacementRequest } from '../core/section-replacement-request';

export class SectionReplacer {
  constructor(private _suppressWarnings = false) {}

  replaceSection(request: SectionReplacementRequest): string {
    const markerPositions = this.findMarkerPositions(request);
    
    if (this.hasInvalidMarkers(markerPositions)) {
      this.logMissingMarkersWarning(request);
      return request.content;
    }
    
    return this.buildReplacementContent(request, markerPositions);
  }

  private hasInvalidMarkers(positions: { startIndex: number; endIndex: number }): boolean {
    return positions.startIndex === -1 || positions.endIndex === -1;
  }

  private logMissingMarkersWarning(request: SectionReplacementRequest): void {
    if (!this._suppressWarnings && !this.isTestEnvironment()) {
      process.stderr.write(`Warning: Markers ${request.startMarker}/${request.endMarker} not found\n`);
    }
  }

  private isTestEnvironment(): boolean {
    return process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
  }

  private findMarkerPositions(request: SectionReplacementRequest) {
    return {
      startIndex: request.content.indexOf(request.startMarker),
      endIndex: request.content.indexOf(request.endMarker)
    };
  }

  private buildReplacementContent(request: SectionReplacementRequest, positions: { startIndex: number; endIndex: number }): string {
    return request.content.substring(0, positions.startIndex) + 
           request.startMarker + '\n' + request.newContent + '\n' + 
           request.content.substring(positions.endIndex);
  }
}