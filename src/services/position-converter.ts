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
      location: LocationInfo.createLocationFromNode(sourceFile, node),
      text: node.getText()
    };
  }
}