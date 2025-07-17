import { SourceFile, ImportDeclaration } from 'ts-morph';
import { ASTService } from './ast-service';
import * as path from 'path';

export class ImportReferenceService {
  private astService = new ASTService();

  async findReferencingFiles(sourcePath: string): Promise<string[]> {
    const project = this.astService.getProject();
    const referencingFiles: string[] = [];
    
    for (const sourceFile of project.getSourceFiles()) {
      if (this.fileImportsFrom(sourceFile, sourcePath)) {
        referencingFiles.push(sourceFile.getFilePath());
      }
    }
    
    return referencingFiles;
  }

  async updateImportReferences(sourcePath: string, destinationPath: string, referencingFiles: string[]): Promise<void> {
    const project = this.astService.getProject();
    
    for (const filePath of referencingFiles) {
      const sourceFile = project.getSourceFile(filePath);
      if (sourceFile) {
        this.updateImportsInFile(sourceFile, sourcePath, destinationPath);
        await this.astService.saveSourceFile(sourceFile);
      }
    }
  }

  private fileImportsFrom(sourceFile: SourceFile, targetPath: string): boolean {
    const imports = sourceFile.getImportDeclarations();
    const targetPathWithoutExtension = targetPath.replace(/\.ts$/, '');
    
    return imports.some(importDeclaration => {
      const moduleSpecifier = importDeclaration.getModuleSpecifierValue();
      const resolvedPath = this.resolveImportPath(sourceFile.getFilePath(), moduleSpecifier);
      return resolvedPath === targetPathWithoutExtension || resolvedPath === targetPath;
    });
  }

  private updateImportsInFile(sourceFile: SourceFile, sourcePath: string, destinationPath: string): void {
    const imports = sourceFile.getImportDeclarations();
    const updateContext = this.createUpdateContext(sourceFile, sourcePath, destinationPath);
    
    imports.forEach(importDeclaration => {
      this.updateImportDeclaration(importDeclaration, updateContext);
    });
  }

  private createUpdateContext(sourceFile: SourceFile, sourcePath: string, destinationPath: string) {
    return {
      filePath: sourceFile.getFilePath(),
      sourcePathWithoutExtension: sourcePath.replace(/\.ts$/, ''),
      sourcePath,
      destinationPath
    };
  }

  private updateImportDeclaration(importDeclaration: ImportDeclaration, context: { filePath: string; sourcePathWithoutExtension: string; sourcePath: string; destinationPath: string }): void {
    const moduleSpecifier = importDeclaration.getModuleSpecifierValue();
    const resolvedPath = this.resolveImportPath(context.filePath, moduleSpecifier);
    
    if (this.isTargetImport(resolvedPath, context.sourcePathWithoutExtension, context.sourcePath)) {
      const newImportPath = this.calculateNewImportPath(context.filePath, context.destinationPath);
      importDeclaration.setModuleSpecifier(newImportPath);
    }
  }

  private isTargetImport(resolvedPath: string, sourcePathWithoutExtension: string, sourcePath: string): boolean {
    return resolvedPath === sourcePathWithoutExtension || resolvedPath === sourcePath;
  }

  private resolveImportPath(fromFile: string, importPath: string): string {
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      const fromDir = path.dirname(fromFile);
      return path.resolve(fromDir, importPath);
    }
    return importPath;
  }

  private calculateNewImportPath(fromFile: string, destinationPath: string): string {
    const fromDir = path.dirname(fromFile);
    const destinationWithoutExtension = destinationPath.replace(/\.ts$/, '');
    let relativePath = path.relative(fromDir, destinationWithoutExtension);
    
    if (!relativePath.startsWith('./') && !relativePath.startsWith('../')) {
      relativePath = './' + relativePath;
    }
    
    return relativePath.replace(/\\/g, '/');
  }
}