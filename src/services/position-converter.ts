import { Node, SourceFile } from 'ts-morph';
import { LocationRange } from '../core/location-parser';
import { UsageLocation } from './cross-file-reference-finder';

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
    
    return {
      filePath: sourceFile.getFilePath(),
      line: start.line,
      column: start.column,
      endLine: end.line,
      endColumn: end.column,
      text: node.getText()
    };
  }
}