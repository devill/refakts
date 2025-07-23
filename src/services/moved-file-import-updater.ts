import * as path from 'path';
import { ASTService } from './ast-service';

export class MovedFileImportUpdater {
  constructor(private astService: ASTService) {}

  async checkMovedFileHasImportsToUpdate(originalPath: string, newPath: string): Promise<boolean> {
    try {
      const project = this.astService.getProject();
      let movedFile = project.getSourceFile(newPath);
      
      if (!movedFile) {
        movedFile = project.addSourceFileAtPath(newPath);
      }

      const imports = movedFile.getImportDeclarations();
      for (const importDecl of imports) {
        const moduleSpecifier = importDecl.getModuleSpecifierValue();
        if (this.isRelativeImport(moduleSpecifier)) {
          return true;
        }
      }

      const exports = movedFile.getExportDeclarations();
      for (const exportDecl of exports) {
        const moduleSpecifier = exportDecl.getModuleSpecifier();
        if (moduleSpecifier) {
          const moduleSpecifierValue = moduleSpecifier.getLiteralValue();
          if (this.isRelativeImport(moduleSpecifierValue)) {
            return true;
          }
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  async updateImportsInMovedFile(originalPath: string, newPath: string): Promise<void> {
    try {
      const project = this.astService.getProject();
      let movedFile = project.getSourceFile(newPath);
      
      if (!movedFile) {
        movedFile = project.addSourceFileAtPath(newPath);
      }

      const originalDir = path.dirname(originalPath);
      const newDir = path.dirname(newPath);

      const imports = movedFile.getImportDeclarations();
      for (const importDecl of imports) {
        const moduleSpecifier = importDecl.getModuleSpecifierValue();
        if (this.isRelativeImport(moduleSpecifier)) {
          const newImportPath = this.recalculateRelativeImport(moduleSpecifier, originalDir, newDir);
          importDecl.setModuleSpecifier(newImportPath);
        }
      }

      const exports = movedFile.getExportDeclarations();
      for (const exportDecl of exports) {
        const moduleSpecifier = exportDecl.getModuleSpecifier();
        if (moduleSpecifier) {
          const moduleSpecifierValue = moduleSpecifier.getLiteralValue();
          if (this.isRelativeImport(moduleSpecifierValue)) {
            const newExportPath = this.recalculateRelativeImport(moduleSpecifierValue, originalDir, newDir);
            exportDecl.setModuleSpecifier(newExportPath);
          }
        }
      }

      await this.astService.saveSourceFile(movedFile);
    } catch {
    }
  }

  private isRelativeImport(moduleSpecifier: string): boolean {
    return moduleSpecifier.startsWith('./') || moduleSpecifier.startsWith('../');
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