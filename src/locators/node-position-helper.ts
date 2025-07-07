import { Node, SourceFile } from 'ts-morph';

/**
 * Static utility methods for working with TypeScript node positions.
 */
export class NodePositionHelper {
  
  /**
   * Calculates the position from line and column numbers
   */
  static calculatePosition(sourceFile: SourceFile, line: number, column: number): number {
    return sourceFile.compilerNode.getPositionOfLineAndCharacter(line - 1, column - 1);
  }

  /**
   * Gets the node at a specific position
   */
  static getNodeAtPosition(sourceFile: SourceFile, position: number, line: number, column: number): Node {
    const node = sourceFile.getDescendantAtPos(position);
    if (!node) {
      throw new Error(`No node found at line ${line}, column ${column}`);
    }
    return node;
  }

  /**
   * Gets the position information for a node
   */
  static getNodePosition(node: Node): { line: number; column: number } {
    const sourceFile = node.getSourceFile();
    const start = node.getStart();
    const lineAndColumn = sourceFile.getLineAndColumnAtPos(start);
    return { line: lineAndColumn.line, column: lineAndColumn.column };
  }
}