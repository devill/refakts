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
    const start = sourceFile.getLineAndColumnAtPos(node.getStart());
    const end = sourceFile.getLineAndColumnAtPos(node.getEnd());
    
    const locationInfo = new LocationInfo(
      sourceFile.getFilePath(),
      { line: start.line, column: start.column },
      { line: end.line, column: end.column }
    );
    
    return {
      location: locationInfo,
      text: node.getText()
    };
  }
}