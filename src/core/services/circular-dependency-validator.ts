import {ImportReferenceService} from './import-reference-service';
import * as path from 'path';

export class CircularDependencyValidator {
  constructor(private importReferenceService: ImportReferenceService) {}

  validate(sourcePath: string, destinationPath: string, referencingFiles: string[]): void {
    for (const referencingFile of referencingFiles) {
      if (this.wouldCreateCircularDependency(sourcePath, destinationPath, referencingFile)) {
        throw this.circularDependencyError(sourcePath, destinationPath, referencingFile);
      }
    }
  }

  private wouldCreateCircularDependency(sourcePath: string, destinationPath: string, referencingFile: string): boolean {
    if (path.dirname(destinationPath) !== path.dirname(referencingFile)) {
      return false;
    }
    return this.importReferenceService.checkFileImportsFrom(sourcePath, referencingFile);
  }

  private circularDependencyError(sourcePath: string, destinationPath: string, referencingFile: string): Error {
    const source = path.relative(process.cwd(), sourcePath);
    const destination = path.relative(process.cwd(), destinationPath);
    const referencing = path.relative(process.cwd(), referencingFile);
    return new Error(`Moving ${source} to ${destination} would create circular dependency with ${referencing}`);
  }
}
