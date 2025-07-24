import { Node, SourceFile } from 'ts-morph';

export interface NodePositionParams {
  position: number;
  line: number;
  column: number;
}

export class NodePositionService {
  static calculatePosition(sourceFile: SourceFile, line: number, column: number): number {
    return sourceFile.compilerNode.getPositionOfLineAndCharacter(line - 1, column - 1);
  }

  static getNodeAtPosition(sourceFile: SourceFile, params: NodePositionParams): Node {
    const node = sourceFile.getDescendantAtPos(params.position);
    if (!node) {
      throw new Error(`No node found at line ${params.line}, column ${params.column}`);
    }
    return node;
  }

  static getNodePosition(node: Node): { line: number; column: number } {
    const sourceFile = node.getSourceFile();
    const start = node.getStart();
    const lineAndColumn = sourceFile.getLineAndColumnAtPos(start);
    return { line: lineAndColumn.line, column: lineAndColumn.column };
  }
}