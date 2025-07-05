export class SectionReplacer {
  replaceSection(content: string, startMarker: string, endMarker: string, newContent: string): string {
    const markerPositions = this.findMarkerPositions(content, startMarker, endMarker);
    
    if (markerPositions.startIndex === -1 || markerPositions.endIndex === -1) {
      process.stderr.write(`Warning: Markers ${startMarker}/${endMarker} not found\n`);
      return content;
    }
    
    return this.buildReplacementContent(content, markerPositions, startMarker, newContent);
  }

  private findMarkerPositions(content: string, startMarker: string, endMarker: string) {
    return {
      startIndex: content.indexOf(startMarker),
      endIndex: content.indexOf(endMarker)
    };
  }

  private buildReplacementContent(content: string, positions: { startIndex: number; endIndex: number }, startMarker: string, newContent: string): string {
    return content.substring(0, positions.startIndex) + 
           startMarker + '\n' + newContent + '\n' + 
           content.substring(positions.endIndex);
  }
}