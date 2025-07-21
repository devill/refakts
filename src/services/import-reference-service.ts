import {ExportDeclaration, ImportDeclaration, Project, SourceFile} from 'ts-morph';
import {ASTService} from './ast-service';
import * as path from 'path';

export class ImportReferenceService {
  private astService = new ASTService();

  checkFileImportsFrom(sourcePath: string, targetPath: string): boolean {
    try {
      const sourceFile = this.astService.loadSourceFile(sourcePath);
      return this.fileImportsFrom(sourceFile, targetPath);
    } catch {
      return false;
    }
  }

  async findReferencingFiles(sourcePath: string): Promise<string[]> {
    try {
      const project = this.loadAllProjectFiles();
      return this.collectReferencingFiles(project, sourcePath);
    } catch {
      return [];
    }
  }

  private loadAllProjectFiles() {
    const project = this.astService.getProject();
    project.addSourceFilesAtPaths("**/*.ts");
    return project;
  }

  private collectReferencingFiles(project: Project, sourcePath: string): string[] {
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
    const exports = sourceFile.getExportDeclarations();
    const targetPaths = this.createTargetPathVariants(targetPath);
    
    const hasImportFromTarget = this.checkImportsFromTarget(imports, targetPaths, sourceFile);
    const hasExportFromTarget = this.checkExportsFromTarget(exports, targetPaths, sourceFile);
    
    return hasImportFromTarget || hasExportFromTarget;
  }

  private checkImportsFromTarget(imports: ImportDeclaration[], targetPaths: string[], sourceFile: SourceFile): boolean {
    return imports.some(importDeclaration => {
      const moduleSpecifier = importDeclaration.getModuleSpecifierValue();
      const resolvedPath = this.resolveImportPath(sourceFile.getFilePath(), moduleSpecifier);
      return targetPaths.includes(resolvedPath);
    });
  }

  private checkExportsFromTarget(exports: ExportDeclaration[], targetPaths: string[], sourceFile: SourceFile): boolean {
    return exports.some(exportDeclaration => {
      const moduleSpecifier = exportDeclaration.getModuleSpecifierValue();
      if (!moduleSpecifier) return false;
      const resolvedPath = this.resolveImportPath(sourceFile.getFilePath(), moduleSpecifier);
      return targetPaths.includes(resolvedPath);
    });
  }

  private createTargetPathVariants(targetPath: string): string[] {
    const targetPathWithoutExtension = targetPath.replace(/\.ts$/, '');
    const absoluteTargetPath = path.resolve(targetPath);
    const absoluteTargetPathWithoutExtension = absoluteTargetPath.replace(/\.ts$/, '');
    
    return [
      targetPathWithoutExtension,
      targetPath,
      absoluteTargetPath,
      absoluteTargetPathWithoutExtension
    ];
  }

  private updateImportsInFile(sourceFile: SourceFile, sourcePath: string, destinationPath: string): void {
    const updateContext = this.createUpdateContext(sourceFile, sourcePath, destinationPath);
    
    sourceFile.getImportDeclarations().forEach(importDeclaration => {
      this.updateImportDeclaration(importDeclaration, updateContext);
    });
    
    sourceFile.getExportDeclarations().forEach(exportDeclaration => {
      this.updateExportDeclaration(exportDeclaration, updateContext);
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

  private updateExportDeclaration(exportDeclaration: ExportDeclaration, context: { filePath: string; sourcePathWithoutExtension: string; sourcePath: string; destinationPath: string }): void {
    const moduleSpecifier = exportDeclaration.getModuleSpecifierValue();
    if (!moduleSpecifier) return;
    
    const resolvedPath = this.resolveImportPath(context.filePath, moduleSpecifier);
    
    if (this.isTargetImport(resolvedPath, context.sourcePathWithoutExtension, context.sourcePath)) {
      const newImportPath = this.calculateNewImportPath(context.filePath, context.destinationPath);
      exportDeclaration.setModuleSpecifier(newImportPath);
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