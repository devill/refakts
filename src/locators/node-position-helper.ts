import { SourceFile } from 'ts-morph';
import { NodeContext, PositionRequest } from './NodeContext';

export class NodePositionHelper {
  

  static calculatePosition(sourceFile: SourceFile, line: number, column: number): number {
    return NodeContext.calculatePosition(sourceFile, line, column);
  }


  static getNodeAtPosition(sourceFile: SourceFile, request: PositionRequest): NodeContext {
    return NodeContext.getNodeAtPosition(sourceFile, request);
  }


  static getNodePosition(nodeContext: NodeContext): { line: number; column: number } {
    return nodeContext.getPosition();
  }
}