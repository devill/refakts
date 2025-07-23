import { SectionReplacementRequest } from '../core/section-replacement-request';

export class SectionReplacer {
  constructor(private _suppressWarnings = false) {}

  replaceSection(request: SectionReplacementRequest): string {
    const markerPositions = request.findMarkerPositions();
    
    if (this.hasInvalidMarkers(markerPositions)) {
      this.logMissingMarkersWarning(request);
      return request.content;
    }
    
    return request.buildReplacementContent(markerPositions);
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

}