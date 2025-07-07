import { SectionReplacementRequest } from '../core/section-replacement-request';

export class SectionReplacer {
  constructor(private suppressWarnings: boolean = false) {}

  replaceSection(request: SectionReplacementRequest): string {
    const markerPositions = this.findMarkerPositions(request);
    
    if (markerPositions.startIndex === -1 || markerPositions.endIndex === -1) {
      if (!this.suppressWarnings && !this.isTestEnvironment()) {
        process.stderr.write(`Warning: Markers ${request.startMarker}/${request.endMarker} not found\n`);
      }
      return request.content;
    }
    
    return this.buildReplacementContent(request, markerPositions);
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