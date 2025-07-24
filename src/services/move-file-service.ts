import {ImportReferenceService} from './import-reference-service';
import {ASTService} from './ast-service';
import {FileValidator} from './file-validator';
import {FileMover, RealFileSystemWrapper} from './file-system-wrapper';
import * as path from 'path';
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
  private fileMover: FileMover;

  constructor() {
    const fileSystem = new RealFileSystemWrapper();
    this.fileMover = new FileMover(fileSystem);
  }
  async moveFile(request: MoveFileRequest): Promise<MoveFileResult> {
    const resolvedDestinationPath = this.resolveDestinationPath(request.destinationPath);

    if (this.isSameLocation(request.sourcePath, resolvedDestinationPath)) {
      return MoveFileService.sameLocationResponse(request);
    }

    const astService = ASTService.createForFile(request.sourcePath);
    const fileValidator = new FileValidator(astService, new RealFileSystemWrapper());
    fileValidator.validateSourceFile(request.sourcePath);
    fileValidator.validateDestinationFile(resolvedDestinationPath);

    return await this.performSafeFileMove(request, resolvedDestinationPath, astService);
  }

  private async performSafeFileMove(request: MoveFileRequest, resolvedDestinationPath: string, astService: ASTService) {
    const importReferenceService = new ImportReferenceService();
    const referencingFiles = await this.collectReferences(request, resolvedDestinationPath, importReferenceService);
    await importReferenceService.updateImportReferences(request.sourcePath, resolvedDestinationPath, referencingFiles);
    await this.fileMover.moveFile(request.sourcePath, resolvedDestinationPath);
    
    const updatedReferencingFiles = await this.updateImportsInMovedFile(request.sourcePath, resolvedDestinationPath, referencingFiles, importReferenceService);

    return MoveFileService.moveFileSuccess(request, updatedReferencingFiles);
  }

  private async collectReferences(request: MoveFileRequest, resolvedDestinationPath: string, importReferenceService: ImportReferenceService) {
    const referencingFiles = await importReferenceService.findReferencingFiles(request.sourcePath);
    await this.validateNoCircularDependencies(request.sourcePath, resolvedDestinationPath, referencingFiles, importReferenceService);
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

  private isSameLocation(sourcePath: string, destinationPath: string): boolean {
    return path.resolve(sourcePath) === path.resolve(destinationPath);
  }
  private async validateNoCircularDependencies(sourcePath: string, destinationPath: string, referencingFiles: string[], importReferenceService: ImportReferenceService): Promise<void> {
    for (const referencingFile of referencingFiles) {
      if (this.wouldCreateCircularDependency(sourcePath, destinationPath, referencingFile, importReferenceService)) {
        const relativeSourcePath = path.relative(process.cwd(), sourcePath);
        const relativeDestinationPath = path.relative(process.cwd(), destinationPath);
        const relativeReferencingFile = path.relative(process.cwd(), referencingFile);
        throw new Error(`Moving ${relativeSourcePath} to ${relativeDestinationPath} would create circular dependency with ${relativeReferencingFile}`);
      }
    }
  }

  private wouldCreateCircularDependency(sourcePath: string, destinationPath: string, referencingFile: string, importReferenceService: ImportReferenceService): boolean {
    const destinationDir = path.dirname(destinationPath);
    const referencingDir = path.dirname(referencingFile);
    
    if (destinationDir === referencingDir) {
      return importReferenceService.checkFileImportsFrom(sourcePath, referencingFile);
    }
    
    return false;
  }

  private async updateImportsInMovedFile(originalPath: string, newPath: string, referencingFiles: string[], importReferenceService: ImportReferenceService): Promise<string[]> {
    const movedFileNeedsUpdate = await importReferenceService.checkMovedFileHasImportsToUpdate(originalPath, newPath);
    
    if (movedFileNeedsUpdate) {
      await importReferenceService.updateImportsInMovedFile(originalPath, newPath);
      return [...referencingFiles, newPath];
    }
    
    return referencingFiles;
  }

}