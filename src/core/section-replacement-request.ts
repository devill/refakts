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
}