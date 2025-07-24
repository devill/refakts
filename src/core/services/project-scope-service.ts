import * as path from 'path';
import { FileSystemHelper } from './file-system/helper';
import { Project } from 'ts-morph';

export class ProjectScopeService {
  private fileSystemHelper: FileSystemHelper;

  constructor(project: Project) {
    this.fileSystemHelper = new FileSystemHelper(project);
  }

  determineScopeDirectory(filePath: string): string | undefined {
    if (this.isTestFixture(filePath)) {
      return this.getTestFixtureScope(filePath);
    }
    
    return this.getProductionScope(filePath);
  }

  private isTestFixture(filePath: string): boolean {
    return filePath.includes('/tests/fixtures/') && filePath.includes('/input/');
  }

  private getTestFixtureScope(filePath: string): string {
    const inputIndex = filePath.lastIndexOf('/input/');
    const inputDir = filePath.substring(0, inputIndex + '/input'.length);
    return path.resolve(inputDir);
  }

  private getProductionScope(filePath: string): string {
    return this.fileSystemHelper.findProjectRoot(filePath);
  }
}