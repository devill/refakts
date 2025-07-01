import { Project, Node, SourceFile } from 'ts-morph';
import { TSQueryHandler } from '../tsquery-handler';
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
}