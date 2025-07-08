import { SourceFile, ImportDeclaration, ImportSpecifier } from 'ts-morph';

export class ImportSymbolExtractor {
  static getImportedSymbols(sourceFile: SourceFile): Set<string> {
    const importedSymbols = new Set<string>();
    const externalImports = this.getExternalImports(sourceFile);
    
    externalImports.forEach(importDecl => {
      this.extractSymbolsFromImport(importDecl, importedSymbols);
    });
    
    return importedSymbols;
  }

  private static getExternalImports(sourceFile: SourceFile): ImportDeclaration[] {
    return sourceFile.getImportDeclarations().filter(importDecl => {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      return this.isExternalModule(moduleSpecifier);
    });
  }

  private static extractSymbolsFromImport(importDecl: ImportDeclaration, importedSymbols: Set<string>): void {
    this.addNamedImports(importDecl, importedSymbols);
    this.addDefaultImport(importDecl, importedSymbols);
    this.addNamespaceImport(importDecl, importedSymbols);
  }

  private static addNamedImports(importDecl: ImportDeclaration, importedSymbols: Set<string>): void {
    importDecl.getNamedImports().forEach((namedImport: ImportSpecifier) => {
      importedSymbols.add(namedImport.getName());
    });
  }

  private static addDefaultImport(importDecl: ImportDeclaration, importedSymbols: Set<string>): void {
    const defaultImport = importDecl.getDefaultImport();
    if (defaultImport) {
      importedSymbols.add(defaultImport.getText());
    }
  }

  private static addNamespaceImport(importDecl: ImportDeclaration, importedSymbols: Set<string>): void {
    const namespaceImport = importDecl.getNamespaceImport();
    if (namespaceImport) {
      importedSymbols.add(namespaceImport.getText());
    }
  }

  static isExternalModule(moduleSpecifier: string): boolean {
    return !moduleSpecifier.startsWith('.') && !moduleSpecifier.startsWith('/');
  }

  static isInternalClassReference(text: string, importedSymbols: Set<string>): boolean {
    if (!this.isValidClassName(text)) return false;
    if (this.isBuiltInClass(text)) return false;
    if (importedSymbols.has(text)) return false;
    
    return true;
  }

  private static isValidClassName(text: string): boolean {
    return /^[a-z][a-zA-Z0-9]*$/.test(text);
  }

  private static isBuiltInClass(text: string): boolean {
    const builtInClasses = [
      'console', 'process', 'window', 'document', 'Math', 'Date', 'JSON', 'Object', 'Array', 'String', 'Number', 'Boolean',
      'Promise', 'Error', 'RegExp', 'Map', 'Set', 'WeakMap', 'WeakSet', 'Symbol', 'Buffer'
    ];
    
    return builtInClasses.includes(text);
  }
}