import { Project, Node, SourceFile } from 'ts-morph';
import { TSQueryHandler } from '../tsquery-handler';
import { LocationParser, LocationRange } from '../utils/location-parser';
import * as path from 'path';

export class ASTService {
  private project: Project;
  private tsQueryHandler: TSQueryHandler;

  constructor(project?: Project) {
    this.project = project || new Project();
    this.tsQueryHandler = new TSQueryHandler();
  }

  loadSourceFile(filePath: string): SourceFile {
    const absolutePath = path.resolve(filePath);
    if (this.project.getSourceFile(absolutePath)) {
      return this.project.getSourceFile(absolutePath)!;
    }
    return this.project.addSourceFileAtPath(absolutePath);
  }

  findNodeByQuery(sourceFile: SourceFile, query: string): Node {
    return this.tsQueryHandler.findNodeByQuery(sourceFile, query);
  }

  findNodesByQuery(sourceFile: SourceFile, query: string): Node[] {
    return this.tsQueryHandler.findNodesByQuery(sourceFile, query);
  }

  findTargetNode(sourceFile: SourceFile, query: string): Node {
    const targetNodes = this.findNodesByQuery(sourceFile, query);
    if (targetNodes.length === 0) {
      throw new Error(`No matches found for query: ${query}`);
    }
    return targetNodes[0];
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
    return sourceFile.compilerNode.getPositionOfLineAndCharacter(location.startLine - 1, location.startColumn - 1);
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
    return this.traverseToFindMatchingNode(node, expectedEnd);
  }

  private calculateExpectedEnd(sourceFile: SourceFile, location: LocationRange): number {
    return sourceFile.compilerNode.getPositionOfLineAndCharacter(location.endLine - 1, location.endColumn - 1);
  }

  private traverseToFindMatchingNode(node: Node, expectedEnd: number): Node | null {
    let current: Node | undefined = node;
    while (current) {
      if (this.isNodeEndCloseToExpected(current, expectedEnd)) {
        return current;
      }
      current = current.getParent();
    }
    return null;
  }

  private isNodeEndCloseToExpected(node: Node, expectedEnd: number): boolean {
    return Math.abs(node.getEnd() - expectedEnd) <= 3;
  }
}