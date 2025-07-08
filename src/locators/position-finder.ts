import { Node, SourceFile } from 'ts-morph';
import { NodeAnalyzer } from './node-analyzer';
import { PositionData } from '../core/position-data';

export class PositionFinder {
  getDeclarationAtPosition(sourceFile: SourceFile, positionData: PositionData): Node {
    const position = NodeAnalyzer.calculatePosition(sourceFile, positionData.line, positionData.column);
    const node = NodeAnalyzer.getNodeAtPosition(sourceFile, { position, line: positionData.line, column: positionData.column });
    
    const declarationNode = NodeAnalyzer.findContainingDeclaration(node);
    if (!declarationNode) {
      throw new Error(`No variable declaration found at line ${positionData.line}, column ${positionData.column}`);
    }
    return declarationNode;
  }
}