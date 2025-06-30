import * as ts from 'typescript';
import { Project, Node, SourceFile } from 'ts-morph';
import { SourceFileHelper } from './source-file-helper';

export interface VariableLocation {
  kind: 'declaration' | 'usage';
  line: number;
  column: number;
  text: string;
}

export interface VariableLocationResult {
  variable: string;
  declaration: VariableLocation;
  usages: VariableLocation[];
}

export class VariableLocator {
  private project: Project;

  constructor() {
    this.project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.CommonJS,
      },
    });
  }

  async findVariableReferences(filePath: string, variableName: string): Promise<VariableLocationResult> {
    const sourceFile = this.loadSourceFile(filePath);
    const declaration = this.getDeclarationOrThrow(sourceFile, variableName);
    const usages = this.findUsages(sourceFile, variableName, declaration);
    
    return this.buildLocationResult(variableName, declaration, usages);
  }

  private loadSourceFile(filePath: string): SourceFile {
    const fs = require('fs');
    const content = fs.readFileSync(filePath, 'utf8');
    return this.project.createSourceFile(filePath, content);
  }

  private getDeclarationOrThrow(sourceFile: SourceFile, variableName: string): Node {
    const declaration = this.findDeclaration(sourceFile, variableName);
    if (!declaration) {
      throw new Error(`Could not find declaration for variable: ${variableName}`);
    }
    return declaration;
  }

  private buildLocationResult(variableName: string, declaration: Node, usages: Node[]): VariableLocationResult {
    return {
      variable: variableName,
      declaration: this.createLocation(declaration, 'declaration'),
      usages: usages.map(usage => this.createLocation(usage, 'usage'))
    };
  }

  private findDeclaration(sourceFile: SourceFile, variableName: string): Node | undefined {
    return SourceFileHelper.findDescendant(sourceFile, 
      node => this.isMatchingDeclaration(node, variableName));
  }

  private isMatchingDeclaration(node: Node, variableName: string): boolean {
    return this.isVariableDeclaration(node, variableName) || 
           this.isParameterDeclaration(node, variableName);
  }

  private isVariableDeclaration(node: Node, variableName: string): boolean {
    return node.getKind() === ts.SyntaxKind.VariableDeclaration &&
           this.hasMatchingIdentifier(node, variableName);
  }

  private isParameterDeclaration(node: Node, variableName: string): boolean {
    return node.getKind() === ts.SyntaxKind.Parameter &&
           this.hasMatchingIdentifier(node, variableName);
  }

  private hasMatchingIdentifier(node: Node, variableName: string): boolean {
    const identifier = node.getFirstDescendantByKind(ts.SyntaxKind.Identifier);
    return identifier?.getText() === variableName;
  }

  private findUsages(sourceFile: SourceFile, variableName: string, declaration: Node): Node[] {
    const usages: Node[] = [];
    const declarationIdentifier = this.getDeclarationIdentifier(declaration);
    
    sourceFile.forEachDescendant((node: Node) => {
      if (this.isUsageNode(node, variableName, declarationIdentifier)) {
        usages.push(node);
      }
    });
    
    return usages;
  }

  private getDeclarationIdentifier(declaration: Node): Node | undefined {
    return declaration.getFirstDescendantByKind(ts.SyntaxKind.Identifier);
  }

  private isUsageNode(node: Node, variableName: string, declarationIdentifier: Node | undefined): boolean {
    return node.getKind() === ts.SyntaxKind.Identifier && 
           node.getText() === variableName && 
           node !== declarationIdentifier;
  }

  private createLocation(node: Node, kind: 'declaration' | 'usage'): VariableLocation {
    const position = this.getNodePosition(node);
    
    return {
      kind,
      line: position.line,
      column: position.column,
      text: node.getText()
    };
  }

  private getNodePosition(node: Node): {line: number; column: number} {
    const start = node.getStart();
    const sourceFile = node.getSourceFile();
    return sourceFile.getLineAndColumnAtPos(start);
  }
}