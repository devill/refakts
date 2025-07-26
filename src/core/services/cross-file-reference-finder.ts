import {Node, Project, SourceFile, SyntaxKind, Symbol} from 'ts-morph';
import {LocationRange, UsageLocation} from '../ast/location-range';
import {FileSystemHelper} from './file-system/helper';
import {PositionConverter} from './position-converter';


export interface FindUsagesResult {
  symbol: string;
  definition: UsageLocation | null;
  usages: UsageLocation[];
}

export class CrossFileReferenceFinder {
  private fileSystemHelper: FileSystemHelper;

  constructor(private _project: Project) {
    this.fileSystemHelper = new FileSystemHelper(_project);
  }

  async findAllReferences(location: LocationRange, sourceFile?: SourceFile, scopeDirectory?: string): Promise<FindUsagesResult> {
    this.fileSystemHelper.loadProjectFiles(location.file);
    const resolvedSourceFile = this.resolveSourceFile(location.file, sourceFile);
    const { symbol: targetSymbol, targetNode } = this.extractSemanticSymbolFromLocation(resolvedSourceFile, location);
    const symbolName = this.getSymbolName(targetSymbol);
    const usages = this.findSemanticUsagesInProject(targetSymbol, targetNode, scopeDirectory);
    const definition = usages.length > 0 ? usages[0] : null;
    return { symbol: symbolName, definition, usages };
  }

  private resolveSourceFile(filePath: string, sourceFile?: SourceFile): SourceFile {
    return sourceFile || this.getOrLoadSourceFile(filePath);
  }

  private getOrLoadSourceFile(filePath: string): SourceFile {
    const existingFile = this._project.getSourceFile(filePath);
    if (existingFile) {
      return existingFile;
    }
    return this.loadSourceFileAtPath(filePath);
  }

  private loadSourceFileAtPath(filePath: string): SourceFile {
    try {
      return this._project.addSourceFileAtPath(filePath);
    } catch {
      throw new Error(`File not found: ${filePath}`);
    }
  }

  private extractSemanticSymbolFromLocation(sourceFile: SourceFile, location: LocationRange): { symbol: Symbol, targetNode: Node } {
    const node = this.findNodeAtLocation(sourceFile, location);
    if (!node) {
      throw new Error(`No symbol found at location ${location.start.line}:${location.start.column}`);
    }
    const symbol = node.getSymbol();
    if (!symbol) {
      throw new Error(`No symbol found at location ${location.start.line}:${location.start.column}`);
    }
    return { symbol, targetNode: node };
  }


  private findNodeAtLocation(sourceFile: SourceFile, location: LocationRange): Node | null {
    const startPos = PositionConverter.getStartPosition(sourceFile, location);
    return sourceFile.getDescendantAtPos(startPos) || null;
  }

  private getSymbolName(symbol: Symbol): string {
    const declarations = symbol.getDeclarations();
    if (declarations && declarations.length > 0) {
      const firstDeclaration = declarations[0];
      if (firstDeclaration.getKind() === SyntaxKind.Identifier) {
        return firstDeclaration.getText();
      }
      const firstIdentifier = firstDeclaration.getChildrenOfKind(SyntaxKind.Identifier)[0];
      return firstIdentifier ? firstIdentifier.getText() : symbol.getName();
    }
    return symbol.getName();
  }

  private findSemanticUsagesInProject(targetSymbol: Symbol, targetNode: Node, scopeDirectory?: string): UsageLocation[] {
    // Use language service for comprehensive cross-file reference finding
    const languageService = this._project.getLanguageService();

    // Get all references using the language service
    const referencedSymbols = languageService.findReferences(targetNode);
    const usages: UsageLocation[] = [];

    for (const referencedSymbol of referencedSymbols) {
      for (const reference of referencedSymbol.getReferences()) {
        const referenceSourceFile = reference.getSourceFile();
        if (!referenceSourceFile) continue;

        const referenceNode = referenceSourceFile.getDescendantAtPos(reference.getTextSpan().getStart());
        if (!referenceNode) continue;

        // Apply scope filtering
        if (this.isNodeInScope(referenceNode, scopeDirectory)) {
          usages.push(PositionConverter.createUsageLocation(referenceSourceFile, referenceNode));
        }
      }
    }

    // Add CommonJS require() and dynamic import() calls that language service might miss
    const moduleUsages = this.findModuleImportUsages(targetSymbol, targetNode, scopeDirectory);
    usages.push(...moduleUsages);

    return this.deduplicateUsages(usages);
  }

  private findModuleImportUsages(targetSymbol: Symbol, targetNode: Node, scopeDirectory?: string): UsageLocation[] {
    const usages: UsageLocation[] = [];
    const symbolName = this.getSymbolName(targetSymbol);
    const sourceFile = targetNode.getSourceFile();
    
    // Get the module path that exports this symbol
    const moduleFilePath = sourceFile.getFilePath();
    
    // Search all files for require() and import() calls that import this module
    const filteredFiles = this.getFilteredSourceFiles(scopeDirectory);
    
    for (const file of filteredFiles) {
      // Look for require() calls with destructuring
      const requireCalls = file.getDescendantsOfKind(SyntaxKind.CallExpression)
        .filter(call => {
          const expression = call.getExpression();
          return expression.getKind() === SyntaxKind.Identifier && 
                 expression.getText() === 'require';
        });
      
      for (const requireCall of requireCalls) {
        const moduleUsages = this.handleModuleCall(requireCall, moduleFilePath, symbolName, file, 'require');
        usages.push(...moduleUsages);
      }
      
      // Look for dynamic import() calls
      const importCalls = file.getDescendantsOfKind(SyntaxKind.CallExpression)
        .filter(call => {
          const expression = call.getExpression();
          return expression.getKind() === SyntaxKind.ImportKeyword ||
                 (expression.getKind() === SyntaxKind.Identifier && expression.getText() === 'import');
        });
      
      for (const importCall of importCalls) {
        const moduleUsages = this.handleModuleCall(importCall, moduleFilePath, symbolName, file, 'import');
        usages.push(...moduleUsages);
      }
    }
    
    return usages;
  }

  private handleModuleCall(call: any, moduleFilePath: string, symbolName: string, file: SourceFile, callType: 'require' | 'import'): UsageLocation[] {
    const usages: UsageLocation[] = [];
    const args = call.getArguments();
    if (args.length === 0) return usages;
    
    const moduleArg = args[0];
    if (moduleArg.getKind() !== SyntaxKind.StringLiteral) return usages;
    
    // Check if this call references our target module
    const requiredPath = moduleArg.getText().slice(1, -1); // Remove quotes
    if (this.isRequirePathReferencingModule(requiredPath, moduleFilePath, file.getFilePath())) {
      // For dynamic imports, we need to find await expressions with destructuring
      if (callType === 'import') {
        // Look for await import() patterns in variable declarations
        let parent = call.getParent();
        while (parent && parent.getKind() !== SyntaxKind.VariableDeclaration) {
          parent = parent.getParent();
        }
        
        if (parent && parent.getKind() === SyntaxKind.VariableDeclaration) {
          const nameNode = parent.getChildAtIndex(0);
          if (nameNode && nameNode.getKind() === SyntaxKind.ObjectBindingPattern) {
            const destructuringUsages = this.extractDestructuredSymbols(nameNode, symbolName, file);
            usages.push(...destructuringUsages);
          }
        }
      } else {
        // Handle require() calls
        const parent = call.getParent();
        if (parent && parent.getKind() === SyntaxKind.VariableDeclaration) {
          const nameNode = parent.getChildAtIndex(0);
          if (nameNode && nameNode.getKind() === SyntaxKind.ObjectBindingPattern) {
            const destructuringUsages = this.extractDestructuredSymbols(nameNode, symbolName, file);
            usages.push(...destructuringUsages);
          }
        }
      }
    }
    
    return usages;
  }

  private extractDestructuredSymbols(bindingPattern: Node, symbolName: string, file: SourceFile): UsageLocation[] {
    const usages: UsageLocation[] = [];
    const identifiers = bindingPattern.getDescendantsOfKind(SyntaxKind.Identifier);
    
    for (const identifier of identifiers) {
      if (identifier.getText() === symbolName) {
        // Add the destructuring import
        usages.push(PositionConverter.createUsageLocation(file, identifier));
        
        // Also find all usages of this imported variable within the same file
        const localUsages = this.findLocalVariableUsages(file, identifier);
        usages.push(...localUsages);
      }
    }
    
    return usages;
  }

  private findLocalVariableUsages(sourceFile: SourceFile, variableIdentifier: Node): UsageLocation[] {
    const usages: UsageLocation[] = [];
    const variableName = variableIdentifier.getText();
    
    // Find all identifiers in the file that match the variable name
    const allIdentifiers = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier);
    
    for (const identifier of allIdentifiers) {
      if (identifier.getText() === variableName && identifier !== variableIdentifier) {
        // Use simple heuristic: if it's a CallExpression or PropertyAccessExpression, it's likely a usage
        const parent = identifier.getParent();
        if (parent && (
          parent.getKind() === SyntaxKind.CallExpression ||
          parent.getKind() === SyntaxKind.PropertyAccessExpression ||
          parent.getKind() === SyntaxKind.BinaryExpression ||
          parent.getKind() === SyntaxKind.TemplateExpression ||
          parent.getKind() === SyntaxKind.ParenthesizedExpression
        )) {
          usages.push(PositionConverter.createUsageLocation(sourceFile, identifier));
        }
      }
    }
    
    return usages;
  }

  private isRequirePathReferencingModule(requirePath: string, targetModulePath: string, requirerPath: string): boolean {
    const path = require('path');
    
    // Handle relative paths
    if (requirePath.startsWith('./') || requirePath.startsWith('../')) {
      const resolvedPath = path.resolve(path.dirname(requirerPath), requirePath);
      // Check if the resolved path matches the target module (with or without .ts extension)
      return resolvedPath === targetModulePath.replace(/\.ts$/, '') || 
             resolvedPath + '.ts' === targetModulePath;
    }
    
    // Handle absolute module names (node_modules, etc.)
    return false; // For now, only handle relative imports
  }
  private getFilteredSourceFiles(scopeDirectory?: string): SourceFile[] {
    const allFiles = this._project.getSourceFiles();
    return scopeDirectory ? this.filterFilesByScope(allFiles, scopeDirectory) : allFiles;
  }

  private filterFilesByScope(files: SourceFile[], scopeDirectory: string): SourceFile[] {
    const normalizedScope = require('path').resolve(scopeDirectory);
    return files.filter(file => this.isFileInScope(file, normalizedScope));
  }

  private isFileInScope(sourceFile: SourceFile, normalizedScope: string): boolean {
    return sourceFile.getFilePath().startsWith(normalizedScope);
  }

  private isNodeInScope(node: Node, scopeDirectory?: string): boolean {
    if (!scopeDirectory) {
      return true;
    }
    const normalizedScope = require('path').resolve(scopeDirectory);
    return node.getSourceFile().getFilePath().startsWith(normalizedScope);
  }
  private deduplicateUsages(usages: UsageLocation[]): UsageLocation[] {
    const seen = new Set<string>();
    return usages.filter(usage => {
      const key = `${usage.location.file}:${usage.location.start.line}:${usage.location.start.column}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}