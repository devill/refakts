import { Project, Node, SourceFile } from 'ts-morph';
import { createLoadFileError } from './error-utils';
import { LocationRange, LocationParser } from '../core/location-range';
import * as path from 'path';
import * as fs from 'fs';

export class ASTService {
  private project: Project | null = null;
  private readonly providedProject?: Project;

  constructor(project?: Project) {
    this.providedProject = project;
  }

  private getOrCreateProject(sourceFilePath?: string): Project {
    if (this.project) {
      return this.project;
    }

    if (this.providedProject) {
      this.project = this.providedProject;
      return this.project;
    }

    this.project = new Project({
      tsConfigFilePath: this.findNearestTsConfig(sourceFilePath)
    });
    
    return this.project;
  }

  private findNearestTsConfig(sourceFilePath?: string): string {
    const startDir = sourceFilePath ? path.dirname(path.resolve(sourceFilePath)) : process.cwd();
    return this.findTsConfigInDirectory(startDir) || path.resolve(process.cwd(), "tsconfig.json");
  }

  private findTsConfigInDirectory(dir: string): string | null {
    const tsConfigPath = path.join(dir, "tsconfig.json");
    
    if (fs.existsSync(tsConfigPath)) {
      return tsConfigPath;
    }
    
    const parentDir = path.dirname(dir);
    if (parentDir === dir) {
      // Reached root directory
      return null;
    }
    
    return this.findTsConfigInDirectory(parentDir);
  }

  loadSourceFile(filePath: string): SourceFile {
    const absolutePath = this.resolveAbsolutePath(filePath);
    const project = this.getOrCreateProject(filePath);
    const existingFile = project.getSourceFile(absolutePath);
    if (existingFile) {
      return existingFile;
    }
    return this.addSourceFileAtPath(absolutePath, filePath);
  }

  private resolveAbsolutePath(filePath: string): string {
    return path.resolve(filePath);
  }

  private addSourceFileAtPath(absolutePath: string, originalPath: string): SourceFile {
    try {
      const project = this.getOrCreateProject(originalPath);
      return project.addSourceFileAtPath(absolutePath);
    } catch (error: unknown) {
      throw createLoadFileError(error, originalPath);
    }
  }



  async saveSourceFile(sourceFile: SourceFile): Promise<void> {
    await sourceFile.save();
  }

  getProject(): Project {
    return this.getOrCreateProject(undefined);
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