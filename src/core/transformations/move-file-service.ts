import {ImportReferenceService} from '../../services/import-reference-service';
import {ASTService} from '../ast/ast-service';
import {FileValidator} from '../../services/file-validator';
import {FileMover, RealFileSystemWrapper} from '../../services/file-system-wrapper';
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

    this.validateMoveRequest(request, resolvedDestinationPath);
    return await this.performSafeFileMove(request, resolvedDestinationPath);
  }

  private validateMoveRequest(request: MoveFileRequest, resolvedDestinationPath: string): void {
    const astService = ASTService.createForFile(request.sourcePath);
    const fileValidator = new FileValidator(astService, new RealFileSystemWrapper());
    fileValidator.validateSourceFile(request.sourcePath);
    fileValidator.validateDestinationFile(resolvedDestinationPath);
  }

  private async performSafeFileMove(request: MoveFileRequest, resolvedDestinationPath: string) {
    const importReferenceService = new ImportReferenceService();
    const referencingFiles = await this.collectReferences(request, resolvedDestinationPath, importReferenceService);
    
    const context = { request, resolvedDestinationPath, referencingFiles, importReferenceService };
    await this.executeFileMove(context);
    const updatedReferencingFiles = await this.handlePostMoveUpdates(context);

    return MoveFileService.moveFileSuccess(request, updatedReferencingFiles);
  }

  private async executeFileMove(context: FileMoveContext): Promise<void> {
    await context.importReferenceService.updateImportReferences(context.request.sourcePath, context.resolvedDestinationPath, context.referencingFiles);
    await this.fileMover.moveFile(context.request.sourcePath, context.resolvedDestinationPath);
  }

  private async handlePostMoveUpdates(context: FileMoveContext): Promise<string[]> {
    return await this.updateImportsInMovedFile({
      originalPath: context.request.sourcePath,
      newPath: context.resolvedDestinationPath,
      referencingFiles: context.referencingFiles,
      importReferenceService: context.importReferenceService
    });
  }

  private async collectReferences(request: MoveFileRequest, resolvedDestinationPath: string, importReferenceService: ImportReferenceService) {
    const referencingFiles = await importReferenceService.findReferencingFiles(request.sourcePath);
    await this.validateNoCircularDependencies({
      sourcePath: request.sourcePath,
      destinationPath: resolvedDestinationPath,
      referencingFiles,
      importReferenceService
    });
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

  private async updateImportsInMovedFile(request: ImportUpdateRequest): Promise<string[]> {
    const movedFileNeedsUpdate = await request.importReferenceService.checkMovedFileHasImportsToUpdate(request.originalPath, request.newPath);
    
    if (movedFileNeedsUpdate) {
      await request.importReferenceService.updateImportsInMovedFile(request.originalPath, request.newPath);
      return [...request.referencingFiles, request.newPath];
    }
    
    return request.referencingFiles;
  }

  private async validateNoCircularDependencies(request: CircularDependencyCheckRequest): Promise<void> {
    for (const referencingFile of request.referencingFiles) {
      if (this.wouldCreateCircularDependency({
        sourcePath: request.sourcePath,
        destinationPath: request.destinationPath,
        referencingFile,
        importReferenceService: request.importReferenceService
      })) {
        const relativeSourcePath = path.relative(process.cwd(), request.sourcePath);
        const relativeDestinationPath = path.relative(process.cwd(), request.destinationPath);
        const relativeReferencingFile = path.relative(process.cwd(), referencingFile);
        throw new Error(`Moving ${relativeSourcePath} to ${relativeDestinationPath} would create circular dependency with ${relativeReferencingFile}`);
      }
    }
  }

  private wouldCreateCircularDependency(request: CircularDependencyCheckContext): boolean {
    const destinationDir = path.dirname(request.destinationPath);
    const referencingDir = path.dirname(request.referencingFile);
    
    if (destinationDir === referencingDir) {
      return request.importReferenceService.checkFileImportsFrom(request.sourcePath, request.referencingFile);
    }
    
    return false;
  }

}

interface CircularDependencyCheckRequest {
  sourcePath: string;
  destinationPath: string;
  referencingFiles: string[];
  importReferenceService: ImportReferenceService;
}

interface ImportUpdateRequest {
  originalPath: string;
  newPath: string;
  referencingFiles: string[];
  importReferenceService: ImportReferenceService;
}

interface CircularDependencyCheckContext {
  sourcePath: string;
  destinationPath: string;
  referencingFile: string;
  importReferenceService: ImportReferenceService;
}

interface FileMoveContext {
  request: MoveFileRequest;
  resolvedDestinationPath: string;
  referencingFiles: string[];
  importReferenceService: ImportReferenceService;
}