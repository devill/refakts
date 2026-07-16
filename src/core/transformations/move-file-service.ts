import {ImportReferenceService} from '../services/import-reference-service';
import {CircularDependencyValidator} from '../services/circular-dependency-validator';
import {ASTService} from '../ast/ast-service';
import {FileValidator} from '../services/file-validator';
import {FileMover, RealFileSystemWrapper} from '../services/file-system/wrapper';
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
  private circularDependencyValidator: CircularDependencyValidator;

  constructor(private importReferenceService: ImportReferenceService = new ImportReferenceService()) {
    this.fileMover = new FileMover(new RealFileSystemWrapper());
    this.circularDependencyValidator = new CircularDependencyValidator(importReferenceService);
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
    const referencingFiles = await this.collectReferences(request.sourcePath, resolvedDestinationPath);
    await this.executeFileMove(request.sourcePath, resolvedDestinationPath, referencingFiles);
    const updatedReferencingFiles = await this.updateImportsInMovedFile(request.sourcePath, resolvedDestinationPath, referencingFiles);

    return MoveFileService.moveFileSuccess(request, updatedReferencingFiles);
  }

  private async collectReferences(sourcePath: string, resolvedDestinationPath: string): Promise<string[]> {
    const referencingFiles = await this.importReferenceService.findReferencingFiles(sourcePath);
    this.circularDependencyValidator.validate(sourcePath, resolvedDestinationPath, referencingFiles);
    return referencingFiles;
  }

  private async executeFileMove(sourcePath: string, resolvedDestinationPath: string, referencingFiles: string[]): Promise<void> {
    await this.importReferenceService.updateImportReferences(sourcePath, resolvedDestinationPath, referencingFiles);
    await this.fileMover.moveFile(sourcePath, resolvedDestinationPath);
  }

  private async updateImportsInMovedFile(sourcePath: string, resolvedDestinationPath: string, referencingFiles: string[]): Promise<string[]> {
    const movedFileNeedsUpdate = await this.importReferenceService.checkMovedFileHasImportsToUpdate(sourcePath, resolvedDestinationPath);

    if (movedFileNeedsUpdate) {
      await this.importReferenceService.updateImportsInMovedFile(sourcePath, resolvedDestinationPath);
      return [...referencingFiles, resolvedDestinationPath];
    }

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

}
