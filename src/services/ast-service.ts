import { Project, Node, SourceFile } from 'ts-morph';
import { LocationRange, LocationParser } from '../core/location-parser';
import * as path from 'path';

export class ASTService {
  private readonly project: Project;

  constructor(project?: Project) {
    this.project = project || new Project();
  }

  loadSourceFile(filePath: string): SourceFile {
    const absolutePath = this.resolveAbsolutePath(filePath);
    const existingFile = this.getExistingSourceFile(absolutePath);
    if (existingFile) {
      return existingFile;
    }
    return this.addSourceFileAtPath(absolutePath, filePath);
  }

  private resolveAbsolutePath(filePath: string): string {
    return path.resolve(filePath);
  }

  private getExistingSourceFile(absolutePath: string): SourceFile | undefined {
    return this.project.getSourceFile(absolutePath);
  }

  private addSourceFileAtPath(absolutePath: string, originalPath: string): SourceFile {
    try {
      return this.project.addSourceFileAtPath(absolutePath);
    } catch {
      throw new Error(`File not found: ${originalPath}`);
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
    const zeroBased = LocationParser.getZeroBasedStartPosition(location);
    try {
      return sourceFile.compilerNode.getPositionOfLineAndCharacter(zeroBased.line, zeroBased.column);
    } catch {
      throw new Error(`No node found at position ${location.start.line}:${location.start.column}`);
    }
  }


  private getNodeAtPosition(sourceFile: SourceFile, startPos: number, location: LocationRange): Node {
    const node = sourceFile.getDescendantAtPos(startPos);
    if (!node) {
      throw new Error(`No node found at position ${location.start.line}:${location.start.column}`);
    }
    return node;
  }

  private findBestMatchingNode(sourceFile: SourceFile, node: Node, location: LocationRange): Node | null {
    const expectedRange = this.calculateExpectedRange(sourceFile, location);
    return this.traverseToFindMatchingNode(node, expectedRange);
  }

  private calculateExpectedRange(sourceFile: SourceFile, location: LocationRange): { start: number; end: number } {
    const expectedStart = this.getStartPosition(sourceFile, location);
    const expectedEnd = this.calculateExpectedEnd(sourceFile, location);
    return { start: expectedStart, end: expectedEnd };
  }

  private calculateExpectedEnd(sourceFile: SourceFile, location: LocationRange): number {
    return sourceFile.compilerNode.getPositionOfLineAndCharacter(location.end.line - 1, location.end.column - 1);
  }

  private traverseToFindMatchingNode(node: Node | undefined, expectedRange: { start: number; end: number }, searchState: { bestMatch: Node | null; bestScore: number } = { bestMatch: null, bestScore: Infinity }): Node | null {
    if (!node) return searchState.bestMatch;
    if (this.isNodeRangeCloseToExpected(node, expectedRange.start, expectedRange.end)) {
      const score = this.calculateNodeScore(node, expectedRange.start, expectedRange.end);
      if (score < searchState.bestScore) {
        return this.traverseToFindMatchingNode(node.getParent(), expectedRange, { bestMatch: node, bestScore: score });
      }
    }
    return this.traverseToFindMatchingNode(node.getParent(), expectedRange, searchState);
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