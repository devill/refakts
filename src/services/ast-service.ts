import { Project, Node, SourceFile } from 'ts-morph';
import { LocationRange } from '../core/location-parser';
import { PositionData } from '../core/position-data';
import * as path from 'path';

export class ASTService {
  private readonly project: Project;

  constructor(project?: Project) {
    this.project = project || new Project();
  }

  loadSourceFile(filePath: string): SourceFile {
    const absolutePath = path.resolve(filePath);
    const existingFile = this.project.getSourceFile(absolutePath);
    if (existingFile) {
      return existingFile;
    }
    try {
      return this.project.addSourceFileAtPath(absolutePath);
    } catch {
      throw new Error(`File not found: ${filePath}`);
    }
  }


  async saveSourceFile(sourceFile: SourceFile): Promise<void> {
    await sourceFile.save();
  }

  getProject(): Project {
    return this.project;
  }

  findNodeByLocation(location: LocationRange): Node {
    const sourceFile = this.loadSourceFile(location.file);
    return this.findNodeInRange(sourceFile, location);
  }

  private findNodeInRange(sourceFile: SourceFile, location: LocationRange): Node {
    const startPos = this.getStartPosition(sourceFile, location);
    const node = this.getNodeAtPosition(sourceFile, startPos, location);
    return this.findBestMatchingNode(sourceFile, node, location) || node;
  }

  private getStartPosition(sourceFile: SourceFile, location: LocationRange): number {
    const positionData = PositionData.fromLocation(location);
    return positionData.toSourceFilePosition(sourceFile);
  }

  private getNodeAtPosition(sourceFile: SourceFile, startPos: number, location: LocationRange): Node {
    const node = sourceFile.getDescendantAtPos(startPos);
    if (!node) {
      throw new Error(`No node found at position ${location.startLine}:${location.startColumn}`);
    }
    return node;
  }

  private findBestMatchingNode(sourceFile: SourceFile, node: Node, location: LocationRange): Node | null {
    const expectedEnd = this.calculateExpectedEnd(sourceFile, location);
    const expectedStart = this.getStartPosition(sourceFile, location);
    return this.traverseToFindMatchingNode(node, expectedStart, expectedEnd);
  }

  private calculateExpectedEnd(sourceFile: SourceFile, location: LocationRange): number {
    return sourceFile.compilerNode.getPositionOfLineAndCharacter(location.endLine - 1, location.endColumn - 1);
  }

  private traverseToFindMatchingNode(node: Node | undefined, expectedStart: number, expectedEnd: number, bestMatch: Node | null = null, bestScore = Infinity): Node | null {
    if (!node) return bestMatch;
    if (this.isNodeRangeCloseToExpected(node, expectedStart, expectedEnd)) {
      const score = this.calculateNodeScore(node, expectedStart, expectedEnd);
      if (score < bestScore) {
        return this.traverseToFindMatchingNode(node.getParent(), expectedStart, expectedEnd, node, score);
      }
    }
    return this.traverseToFindMatchingNode(node.getParent(), expectedStart, expectedEnd, bestMatch, bestScore);
  }

  private traverseToFindMatchingNodeWithPosition(node: Node | undefined, expectedPositions: { start: number; end: number }, bestMatch: Node | null = null, bestScore = Infinity): Node | null {
    if (!node) return bestMatch;
    if (this.isNodeRangeCloseToExpected(node, expectedPositions.start, expectedPositions.end)) {
      const score = this.calculateNodeScore(node, expectedPositions.start, expectedPositions.end);
      if (score < bestScore) {
        return this.traverseToFindMatchingNodeWithPosition(node.getParent(), expectedPositions, node, score);
      }
    }
    return this.traverseToFindMatchingNodeWithPosition(node.getParent(), expectedPositions, bestMatch, bestScore);
  }

  private isNodeRangeCloseToExpected(node: Node, expectedStart: number, expectedEnd: number): boolean {
    const startDiff = Math.abs(node.getStart() - expectedStart);
    const endDiff = Math.abs(node.getEnd() - expectedEnd);
    return startDiff <= 3 && endDiff <= 3;
  }
  
  private calculateNodeScore(node: Node, expectedStart: number, expectedEnd: number): number {
    const startDiff = Math.abs(node.getStart() - expectedStart);
    const endDiff = Math.abs(node.getEnd() - expectedEnd);
    return startDiff + endDiff;
  }
}