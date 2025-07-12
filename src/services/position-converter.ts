import { Node, SourceFile } from 'ts-morph';
import { LocationRange } from '../core/location-parser';
import { UsageLocation, LocationInfo } from '../core/location-types';

export class PositionConverter {
  static getStartPosition(sourceFile: SourceFile, location: LocationRange): number {
    return sourceFile.compilerNode.getPositionOfLineAndCharacter(
      location.startLine - 1,
      location.startColumn - 1
    );
  }

  static createUsageLocation(sourceFile: SourceFile, node: Node): UsageLocation {
    return {
      location: this.createLocationFromNode(sourceFile, node),
      text: node.getText()
    };
  }

  private static createLocationFromNode(sourceFile: SourceFile, node: Node): LocationInfo {
    const positions = this.getNodePositions(sourceFile, node);
    return new LocationInfo(sourceFile.getFilePath(), positions.start, positions.end);
  }

  private static getNodePositions(sourceFile: SourceFile, node: Node) {
    const start = sourceFile.getLineAndColumnAtPos(node.getStart());
    const end = sourceFile.getLineAndColumnAtPos(node.getEnd());
    return {
      start: { line: start.line, column: start.column },
      end: { line: end.line, column: end.column }
    };
  }
}