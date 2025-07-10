import { SourceFile } from 'ts-morph';
import { NodeContext } from './NodeContext';

export interface PositionRequest {
  line: number;
  column: number;
  position: number;
}

export class PositionService {
  static calculatePosition(sourceFile: SourceFile, line: number, column: number): number {
    return sourceFile.compilerNode.getPositionOfLineAndCharacter(line - 1, column - 1);
  }

  static getNodeAtPosition(sourceFile: SourceFile, request: PositionRequest): NodeContext {
    const node = sourceFile.getDescendantAtPos(request.position);
    if (!node) {
      throw new Error(this.createPositionErrorMessage(request));
    }
    return new NodeContext(node);
  }

  private static createPositionErrorMessage(request: PositionRequest): string {
    return `No node found at line ${request.line}, column ${request.column}`;
  }
}