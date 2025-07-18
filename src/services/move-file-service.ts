import {ImportReferenceService} from './import-reference-service';
import {ASTService} from './ast-service';
import * as fs from 'fs';
import * as path from 'path';
import {exec} from 'child_process';
import {promisify} from 'util';
import {SourceFile} from "ts-morph";

const execAsync = promisify(exec);
export interface MoveFileRequest {
  sourcePath: string;
  destinationPath: string;
}
export interface MoveFileResult {
  moved: boolean;
  sourcePath: string;
  destinationPath: string;
  referencingFiles: string[];
  sameLocation: boolean;
}
export class MoveFileService {
  private importReferenceService = new ImportReferenceService();
  private astService = new ASTService();
  async moveFile(request: MoveFileRequest): Promise<MoveFileResult> {
    const resolvedDestinationPath = this.resolveDestinationPath(request.destinationPath);

    if (this.isSameLocation(request.sourcePath, resolvedDestinationPath)) {
      return MoveFileService.sameLocationResponse(request);
    }

    this.validateSourceFile(request.sourcePath);
    this.validateDestinationFile(resolvedDestinationPath);

    return await this.performSafeFileMove(request, resolvedDestinationPath);
  }

  private async performSafeFileMove(request: MoveFileRequest, resolvedDestinationPath: string) {
    const referencingFiles = await this.collectReferences(request, resolvedDestinationPath);
    await this.performMove(request.sourcePath, resolvedDestinationPath);
    await this.importReferenceService.updateImportReferences(request.sourcePath, resolvedDestinationPath, referencingFiles);

    return MoveFileService.moveFileSuccess(request, referencingFiles);
  }

  private async collectReferences(request: MoveFileRequest, resolvedDestinationPath: string) {
    const referencingFiles = await this.importReferenceService.findReferencingFiles(request.sourcePath);
    await this.validateNoCircularDependencies(request.sourcePath, resolvedDestinationPath, referencingFiles);
    return referencingFiles;
  }

  private static moveFileSuccess(request: MoveFileRequest, referencingFiles: string[]) {
    return {
      moved: true,
      sourcePath: request.sourcePath,
      destinationPath: request.destinationPath,
      referencingFiles,
      sameLocation: false
    };
  }

  private static sameLocationResponse(request: MoveFileRequest) {
    return {
      moved: false,
      sourcePath: request.sourcePath,
      destinationPath: request.destinationPath,
      referencingFiles: [],
      sameLocation: true
    };
  }

  private resolveDestinationPath(destinationPath: string): string {
    if (path.isAbsolute(destinationPath)) {
      return destinationPath;
    }
    return path.resolve(destinationPath);
  }

  private validateSourceFile(sourcePath: string): void {
    this.ensureFileExists(sourcePath);
    this.ensureFileHasValidSyntax(sourcePath);
  }

  private validateDestinationFile(destinationPath: string): void {
    if (fs.existsSync(destinationPath)) {
      const relativePath = path.relative(process.cwd(), destinationPath);
      throw new Error(`Cannot move file to ${relativePath} - file already exists`);
    }
  }

  private isSameLocation(sourcePath: string, destinationPath: string): boolean {
    return path.resolve(sourcePath) === path.resolve(destinationPath);
  }

  private ensureFileExists(sourcePath: string): void {
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Source file does not exist: ${sourcePath}`);
    }
  }

  private ensureFileHasValidSyntax(sourcePath: string): void {
    try {
      if (this.hasSyntaxErrors(sourcePath)) {
        const relativePath = path.relative(process.cwd(), sourcePath);
        throw new Error(`Syntax errors detected in ${relativePath}`);
      }
    } catch (error: any) {
      // If the error is from file access (permission, not found), re-throw it
      if (error.message?.includes('Permission denied') || error.message?.includes('Cannot read file')) {
        throw error;
      }
      // For other errors during syntax checking, wrap them appropriately
      throw new Error(`Cannot validate syntax of ${sourcePath}: ${error.message}`);
    }
  }

  private hasSyntaxErrors(sourcePath: string) {
    const seriousErrors = this.collectErrors(this.astService.loadSourceFile(sourcePath));
    return seriousErrors.length > 0;
  }

  private collectErrors(sourceFile: SourceFile) {
    return sourceFile.getPreEmitDiagnostics().filter(diagnostic => {
      const message = diagnostic.getMessageText();
      const messageStr = typeof message === 'string' ? message : message.getMessageText();
      return !messageStr.includes('Cannot find module') &&
          !messageStr.includes('Invalid module name in augmentation') &&
          !messageStr.includes('Cannot find name \'console\'');
    });
  }
  private async validateNoCircularDependencies(sourcePath: string, destinationPath: string, referencingFiles: string[]): Promise<void> {
    for (const referencingFile of referencingFiles) {
      if (this.wouldCreateCircularDependency(sourcePath, destinationPath, referencingFile)) {
        const relativeSourcePath = path.relative(process.cwd(), sourcePath);
        const relativeDestinationPath = path.relative(process.cwd(), destinationPath);
        const relativeReferencingFile = path.relative(process.cwd(), referencingFile);
        throw new Error(`Moving ${relativeSourcePath} to ${relativeDestinationPath} would create circular dependency with ${relativeReferencingFile}`);
      }
    }
  }

  private wouldCreateCircularDependency(sourcePath: string, destinationPath: string, referencingFile: string): boolean {
    const destinationDir = path.dirname(destinationPath);
    const referencingDir = path.dirname(referencingFile);
    
    if (destinationDir === referencingDir) {
      return this.importReferenceService.checkFileImportsFrom(sourcePath, referencingFile);
    }
    
    return false;
  }

  private async performMove(sourcePath: string, destinationPath: string): Promise<void> {
    this.ensureDestinationDirectoryExists(destinationPath);
    await this.performFileMove(sourcePath, destinationPath);
  }

  private ensureDestinationDirectoryExists(destinationPath: string): void {
    const destinationDir = path.dirname(destinationPath);
    if (!fs.existsSync(destinationDir)) {
      fs.mkdirSync(destinationDir, { recursive: true });
    }
  }

  private async performFileMove(sourcePath: string, destinationPath: string): Promise<void> {
    if (await this.shouldUseGitMv(sourcePath)) {
      await this.gitMoveFile(sourcePath, destinationPath);
    } else {
      fs.renameSync(sourcePath, destinationPath);
    }
  }

  private async shouldUseGitMv(sourcePath: string): Promise<boolean> {
    return this.isInGitRepository() && 
           !this.isTestFile(sourcePath) && 
           this.isFileTrackedByGit(sourcePath);
  }

  private isInGitRepository(): boolean {
    try {
      const gitDir = path.join(process.cwd(), '.git');
      return fs.existsSync(gitDir);
    } catch {
      return false;
    }
  }

  private isTestFile(sourcePath: string): boolean {
    return sourcePath.includes('test') || sourcePath.includes('spec');
  }

  private isFileTrackedByGit(sourcePath: string): boolean {
    try {
      const { execSync } = require('child_process');
      execSync(`git ls-files --error-unmatch "${sourcePath}"`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  private async gitMoveFile(sourcePath: string, destinationPath: string): Promise<void> {
    try {
      await execAsync(`git mv "${sourcePath}" "${destinationPath}"`);
    } catch {
      fs.renameSync(sourcePath, destinationPath);
    }
  }
}