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
    const startPos = sourceFile.compilerNode.getPositionOfLineAndCharacter(location.startLine - 1, location.startColumn - 1);
    
    // Start with the node at the position and traverse upward to find the best match
    let node = sourceFile.getDescendantAtPos(startPos);
    if (!node) {
      throw new Error(`No node found at position ${location.startLine}:${location.startColumn}`);
    }
    
    // Traverse up the AST to find a node that best fits the expected range
    let current: Node | undefined = node;
    while (current) {
      const nodeStart = current.getStart();
      const nodeEnd = current.getEnd();
      const expectedEnd = sourceFile.compilerNode.getPositionOfLineAndCharacter(location.endLine - 1, location.endColumn - 1);
      
      // If this node's end is close to our expected end, use it
      if (Math.abs(nodeEnd - expectedEnd) <= 3) { // Allow some tolerance
        return current;
      }
      
      current = current.getParent();
    }
    
    // If no good match found, return the original node
    return node;
  }
}