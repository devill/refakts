import { Node, SourceFile } from 'ts-morph';
import { LocationRange, UsageLocation } from '../core/ast/location-range';
import { UsageTypeAnalyzer } from './usage-type-analyzer';

export class PositionConverter {
  static getStartPosition(sourceFile: SourceFile, location: LocationRange): number {
    return sourceFile.compilerNode.getPositionOfLineAndCharacter(
      location.start.line - 1,
      location.start.column - 1
    );
  }

  static createUsageLocation(sourceFile: SourceFile, node: Node): UsageLocation {
    return {
      location: LocationRange.createLocationFromNode(sourceFile, node),
      text: node.getText(),
      usageType: UsageTypeAnalyzer.determineUsageType(node)
    };
  }
}