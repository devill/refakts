import { Node, SourceFile } from 'ts-morph';
import { LocationRange } from '../core/location-parser';
import { UsageLocation } from '../core/location-types';

export class PositionConverter {
  static getStartPosition(sourceFile: SourceFile, location: LocationRange): number {
    return sourceFile.compilerNode.getPositionOfLineAndCharacter(
      location.startLine - 1,
      location.startColumn - 1
    );
  }

  static createUsageLocation(sourceFile: SourceFile, node: Node): UsageLocation {
    const locationInfo = this.createLocationInfo(sourceFile, node);
    return {
      location: locationInfo,
      text: node.getText()
    };
  }

  private static createLocationInfo(sourceFile: SourceFile, node: Node) {
    const start = sourceFile.getLineAndColumnAtPos(node.getStart());
    const end = sourceFile.getLineAndColumnAtPos(node.getEnd());
    
    return {
      file: sourceFile.getFilePath(),
      startLine: start.line,
      startColumn: start.column,
      endLine: end.line,
      endColumn: end.column
    };
  }
}