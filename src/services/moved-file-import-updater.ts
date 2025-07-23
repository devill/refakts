import * as path from 'path';
import { SourceFile, ImportDeclaration, ExportDeclaration } from 'ts-morph';
import { ASTService } from './ast-service';

export class MovedFileImportUpdater {
  constructor(private astService: ASTService) {}

  async checkMovedFileHasImportsToUpdate(originalPath: string, newPath: string): Promise<boolean> {
    try {
      const movedFile = this.getOrAddSourceFile(newPath);
      return this.hasRelativeImports(movedFile) || this.hasRelativeExports(movedFile);
    } catch {
      return false;
    }
  }

  async updateImportsInMovedFile(originalPath: string, newPath: string): Promise<void> {
    try {
      const movedFile = this.getOrAddSourceFile(newPath);
      this.updateRelativeReferences(movedFile, originalPath, newPath);
      await this.astService.saveSourceFile(movedFile);
    } catch {
      return;
    }
  }

  private updateRelativeReferences(movedFile: SourceFile, originalPath: string, newPath: string): void {
    const originalDir = path.dirname(originalPath);
    const newDir = path.dirname(newPath);
    
    this.updateRelativeImports(movedFile, originalDir, newDir);
    this.updateRelativeExports(movedFile, originalDir, newDir);
  }

  private isRelativeImport(moduleSpecifier: string): boolean {
    return moduleSpecifier.startsWith('./') || moduleSpecifier.startsWith('../');
  }

  private getOrAddSourceFile(filePath: string): SourceFile {
    const project = this.astService.getProject();
    let sourceFile = project.getSourceFile(filePath);
    
    if (!sourceFile) {
      sourceFile = project.addSourceFileAtPath(filePath);
    }
    
    return sourceFile;
  }

  private hasRelativeImports(sourceFile: SourceFile): boolean {
    const imports = sourceFile.getImportDeclarations();
    return imports.some((importDecl: ImportDeclaration) => 
      this.isRelativeImport(importDecl.getModuleSpecifierValue())
    );
  }

  private hasRelativeExports(sourceFile: SourceFile): boolean {
    const exports = sourceFile.getExportDeclarations();
    return exports.some((exportDecl: ExportDeclaration) => {
      const moduleSpecifier = exportDecl.getModuleSpecifier();
      return moduleSpecifier && this.isRelativeImport(moduleSpecifier.getLiteralValue());
    });
  }

  private updateRelativeImports(sourceFile: SourceFile, originalDir: string, newDir: string): void {
    const imports = sourceFile.getImportDeclarations();
    for (const importDecl of imports) {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      if (this.isRelativeImport(moduleSpecifier)) {
        const newImportPath = this.recalculateRelativeImport(moduleSpecifier, originalDir, newDir);
        importDecl.setModuleSpecifier(newImportPath);
      }
    }
  }

  private updateRelativeExports(sourceFile: SourceFile, originalDir: string, newDir: string): void {
    const exports = sourceFile.getExportDeclarations();
    exports.forEach(exportDecl => this.updateExportIfRelative(exportDecl, originalDir, newDir));
  }

  private updateExportIfRelative(exportDecl: ExportDeclaration, originalDir: string, newDir: string): void {
    const moduleSpecifier = exportDecl.getModuleSpecifier();
    if (!moduleSpecifier) return;
    
    const moduleSpecifierValue = moduleSpecifier.getLiteralValue();
    if (this.isRelativeImport(moduleSpecifierValue)) {
      const newExportPath = this.recalculateRelativeImport(moduleSpecifierValue, originalDir, newDir);
      exportDecl.setModuleSpecifier(newExportPath);
    }
  }

  private recalculateRelativeImport(originalImport: string, originalDir: string, newDir: string): string {
    const resolvedFromOriginal = path.resolve(originalDir, originalImport);
    const relativeFromNew = path.relative(newDir, resolvedFromOriginal);
    
    const normalizedRelative = relativeFromNew.replace(/\\/g, '/');
    
    if (normalizedRelative.startsWith('./') || normalizedRelative.startsWith('../')) {
      return normalizedRelative;
    }
    
    return './' + normalizedRelative;
  }
}