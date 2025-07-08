export class SectionReplacementRequest {
  readonly content: string;
  readonly startMarker: string;
  readonly endMarker: string;
  readonly newContent: string;

  constructor(content: string, startMarker: string, endMarker: string, newContent: string) {
    this.content = content;
    this.startMarker = startMarker;
    this.endMarker = endMarker;
    this.newContent = newContent;
  }

  findMarkerPositions() {
    return {
      startIndex: this.content.indexOf(this.startMarker),
      endIndex: this.content.indexOf(this.endMarker)
    };
  }

  buildReplacementContent(positions: { startIndex: number; endIndex: number }): string {
    return this.content.substring(0, positions.startIndex) + 
           this.startMarker + '\n' + this.newContent + '\n' + 
           this.content.substring(positions.endIndex);
  }
}