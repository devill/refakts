import { Node, SourceFile } from 'ts-morph';
import { NodeAnalyzer } from '../../locators/node-analyzer';
import { PositionData } from './position-data';
import { NodeContext } from '../node-context';

export class PositionFinder {
  getDeclarationAtPosition(sourceFile: SourceFile, positionData: PositionData): Node {
    const position = NodeAnalyzer.calculatePosition(sourceFile, positionData.line, positionData.column);
    const node = NodeAnalyzer.getNodeAtPosition(sourceFile, { position, line: positionData.line, column: positionData.column });
    
    return this.extractDeclarationFromNode(node, sourceFile, positionData);
  }

  private extractDeclarationFromNode(node: Node, sourceFile: SourceFile, positionData: PositionData): Node {
    const nodeContext = NodeContext.create(node, sourceFile);
    const declarationNode = nodeContext.getContainingDeclaration();
    if (!declarationNode) {
      throw new Error(`No variable declaration found at line ${positionData.line}, column ${positionData.column}`);
    }
    return declarationNode;
  }
}