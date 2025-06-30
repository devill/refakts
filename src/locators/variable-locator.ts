import * as ts from 'typescript';
import { Project, Node, SourceFile } from 'ts-morph';
import { SourceFileHelper } from './source-file-helper';

export interface VariableLocation {
  kind: 'declaration' | 'usage';
  usageType?: 'read' | 'write' | 'update';
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
      usages: usages.map(usage => this.createUsageLocation(usage))
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

  private createUsageLocation(node: Node): VariableLocation {
    const position = this.getNodePosition(node);
    const usageType = this.determineUsageType(node);
    
    return {
      kind: 'usage',
      usageType,
      line: position.line,
      column: position.column,
      text: node.getText()
    };
  }

  private determineUsageType(node: Node): 'read' | 'write' | 'update' {
    const parent = node.getParent();
    
    if (this.isWriteContext(parent, node)) {
      return 'write';
    }
    
    if (this.isUpdateContext(parent, node)) {
      return 'update';
    }
    
    return 'read';
  }

  private isWriteContext(parent: Node | undefined, node: Node): boolean {
    if (!parent) return false;
    
    if (parent.getKind() === ts.SyntaxKind.BinaryExpression) {
      const binaryExpr = parent as any;
      return binaryExpr.getOperatorToken().getKind() === ts.SyntaxKind.EqualsToken &&
             binaryExpr.getLeft() === node;
    }
    
    return false;
  }

  private isUpdateContext(parent: Node | undefined, node: Node): boolean {
    if (!parent) return false;
    
    if (parent.getKind() === ts.SyntaxKind.PostfixUnaryExpression ||
        parent.getKind() === ts.SyntaxKind.PrefixUnaryExpression) {
      return true;
    }
    
    if (parent.getKind() === ts.SyntaxKind.BinaryExpression) {
      const binaryExpr = parent as any;
      const operator = binaryExpr.getOperatorToken().getKind();
      return (operator === ts.SyntaxKind.PlusEqualsToken ||
              operator === ts.SyntaxKind.MinusEqualsToken ||
              operator === ts.SyntaxKind.AsteriskEqualsToken ||
              operator === ts.SyntaxKind.SlashEqualsToken) &&
             binaryExpr.getLeft() === node;
    }
    
    return false;
  }

  private getNodePosition(node: Node): {line: number; column: number} {
    const start = node.getStart();
    const sourceFile = node.getSourceFile();
    return sourceFile.getLineAndColumnAtPos(start);
  }
}