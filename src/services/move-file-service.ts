import {ImportReferenceService} from './import-reference-service';
import {ASTService} from './ast-service';
import * as fs from 'fs';
import * as path from 'path';
import {exec} from 'child_process';
import {promisify} from 'util';

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
    const resolvedSourcePath = this.resolveSourcePath(request.sourcePath);
    const resolvedDestinationPath = this.resolveDestinationPath(request.destinationPath);
    
    this.validateSourceFile(resolvedSourcePath);
    
    if (this.isSameLocation(resolvedSourcePath, resolvedDestinationPath)) {
      return MoveFileService.sameLocationResponse(request);
    }
    
    const referencingFiles = await this.importReferenceService.findReferencingFiles(resolvedSourcePath);
    await this.validateNoCircularDependencies(resolvedSourcePath, resolvedDestinationPath, referencingFiles);
    
    this.validateDestinationFile(resolvedDestinationPath);
    await this.performMove(resolvedSourcePath, resolvedDestinationPath);
    await this.importReferenceService.updateImportReferences(resolvedSourcePath, resolvedDestinationPath, referencingFiles);
    
    return MoveFileService.moveFileSuccess(request, referencingFiles);
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

  private resolveSourcePath(sourcePath: string): string {
    if (fs.existsSync(sourcePath)) {
      return sourcePath;
    }
    
    const srcPath = path.join('src', sourcePath);
    if (fs.existsSync(srcPath)) {
      return srcPath;
    }
    
    throw new Error(`Source file does not exist: ${sourcePath}`);
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
      const sourceFile = this.astService.loadSourceFile(sourcePath);
      const diagnostics = sourceFile.getPreEmitDiagnostics();
      
      const seriousErrors = diagnostics.filter(diagnostic => {
        const message = diagnostic.getMessageText();
        const messageStr = typeof message === 'string' ? message : message.getMessageText();
        return !messageStr.includes('Cannot find module') && 
               !messageStr.includes('Invalid module name in augmentation') &&
               !messageStr.includes('Cannot find name \'console\'');
      });
      
      if (seriousErrors.length > 0) {
        const relativePath = path.relative(process.cwd(), sourcePath);
        throw new Error(`Syntax errors detected in ${relativePath}`);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Syntax errors detected')) {
        throw error;
      }
      const relativePath = path.relative(process.cwd(), sourcePath);
      throw new Error(`Syntax errors detected in ${relativePath}`);
    }
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