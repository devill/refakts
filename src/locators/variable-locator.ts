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

  async findVariableByPosition(filePath: string, line: number, column: number): Promise<VariableLocationResult> {
    const sourceFile = this.loadSourceFile(filePath);
    const declaration = this.getDeclarationAtPosition(sourceFile, line, column);
    const variableName = this.getVariableName(declaration);
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

  private getDeclarationAtPosition(sourceFile: SourceFile, line: number, column: number): Node {
    // Use the ts-morph method to find node at line/column
    const lineAndColumn = {line: line, column: column};
    const position = sourceFile.compilerNode.getPositionOfLineAndCharacter(line - 1, column - 1);
    const node = sourceFile.getDescendantAtPos(position);
    
    if (!node) {
      throw new Error(`No node found at line ${line}, column ${column}`);
    }
    
    // Find the declaration node that contains this position
    let current: Node | undefined = node;
    while (current) {
      if (this.isAnyDeclaration(current)) {
        return current;
      }
      current = current.getParent();
    }
    
    throw new Error(`No variable declaration found at line ${line}, column ${column}`);
  }

  private getVariableName(declaration: Node): string {
    const identifier = declaration.getFirstDescendantByKind(ts.SyntaxKind.Identifier);
    if (!identifier) {
      throw new Error('Declaration node does not contain an identifier');
    }
    return identifier.getText();
  }

  private isAnyDeclaration(node: Node): boolean {
    return node.getKind() === ts.SyntaxKind.VariableDeclaration ||
           node.getKind() === ts.SyntaxKind.Parameter;
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
      if (this.isUsageNode(node, variableName, declarationIdentifier) && 
          this.isUsageInScope(node, declaration)) {
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

  private isUsageInScope(usage: Node, declaration: Node): boolean {
    const declarationScope = this.getScope(declaration);
    const usageScope = this.getScope(usage);
    
    // Usage must be in the same scope or a child scope of the declaration
    if (!this.isScopeContainedIn(usageScope, declarationScope)) {
      return false;
    }
    
    // Check if there's a shadowing declaration between declaration and usage
    return !this.isShadowedByDeclaration(usage, declaration);
  }

  private getScope(node: Node): Node {
    let current = node.getParent();
    while (current) {
      if (this.isScopeNode(current)) {
        return current;
      }
      current = current.getParent();
    }
    return node.getSourceFile();
  }

  private isScopeNode(node: Node): boolean {
    return node.getKind() === ts.SyntaxKind.FunctionDeclaration ||
           node.getKind() === ts.SyntaxKind.FunctionExpression ||
           node.getKind() === ts.SyntaxKind.ArrowFunction ||
           node.getKind() === ts.SyntaxKind.Block ||
           node.getKind() === ts.SyntaxKind.SourceFile;
  }

  private isScopeContainedIn(innerScope: Node, outerScope: Node): boolean {
    let current: Node | undefined = innerScope;
    while (current) {
      if (current === outerScope) {
        return true;
      }
      current = current.getParent();
    }
    return false;
  }

  private isShadowedByDeclaration(usage: Node, declaration: Node): boolean {
    const variableName = declaration.getFirstDescendantByKind(ts.SyntaxKind.Identifier)?.getText();
    if (!variableName) return false;
    
    const usageScope = this.getScope(usage);
    const declarationScope = this.getScope(declaration);
    
    // If they're in the same scope, no shadowing
    if (usageScope === declarationScope) {
      return false;
    }
    
    // Look for shadowing declarations in scopes between declaration and usage
    let current: Node | undefined = usageScope;
    while (current && current !== declarationScope) {
      if (this.hasShadowingDeclaration(current, variableName, declaration)) {
        return true;
      }
      current = this.getParentScope(current);
    }
    
    return false;
  }

  private getParentScope(scope: Node): Node | undefined {
    let current = scope.getParent();
    while (current) {
      if (this.isScopeNode(current)) {
        return current;
      }
      current = current.getParent();
    }
    return undefined;
  }

  private hasShadowingDeclaration(scope: Node, variableName: string, originalDeclaration: Node): boolean {
    let hasShadowing = false;
    
    scope.forEachDescendant((child: Node) => {
      if (this.isAnyDeclaration(child) && 
          this.hasMatchingIdentifier(child, variableName) &&
          child !== originalDeclaration &&
          this.getScope(child) === scope) { // Only direct children of this scope
        hasShadowing = true;
      }
    });
    
    return hasShadowing;
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