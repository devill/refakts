import { SourceFile } from 'ts-morph';
import { NodeContext } from './NodeContext';
import { PositionRequest, PositionService } from './PositionService';

export class NodePositionHelper {
  

  static calculatePosition(sourceFile: SourceFile, line: number, column: number): number {
    return PositionService.calculatePosition(sourceFile, line, column);
  }


  static getNodeAtPosition(sourceFile: SourceFile, request: PositionRequest): NodeContext {
    return PositionService.getNodeAtPosition(sourceFile, request);
  }


  static getNodePosition(nodeContext: NodeContext): { line: number; column: number } {
    return nodeContext.getPosition();
  }
}