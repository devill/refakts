import * as ts from 'typescript';
import { Node, SourceFile } from 'ts-morph';
import { SourceFileHelper } from './source-file-helper';
import { ShadowingDetector } from './shadowing-detector';

export class VariableNodeMatcher {
  private shadowingDetector = new ShadowingDetector();

  findDeclaration(sourceFile: SourceFile, variableName: string): Node | undefined {
    return SourceFileHelper.findDescendant(sourceFile, 
      node => this.isMatchingDeclaration(node, variableName));
  }

  findUsages(sourceFile: SourceFile, variableName: string, declaration: Node): Node[] {
    const usages: Node[] = [];
    const declarationIdentifier = this.getDeclarationIdentifier(declaration);
    
    this.collectUsages(sourceFile, usages, variableName, declarationIdentifier, declaration);
    
    return usages;
  }

  private collectUsages(sourceFile: SourceFile, usages: Node[], variableName: string, declarationIdentifier: Node | undefined, declaration: Node): void {
    sourceFile.forEachDescendant((node: Node) => {
      if (this.isValidUsage(node, variableName, declarationIdentifier, declaration)) {
        usages.push(node);
      }
    });
  }

  getVariableName(declaration: Node): string {
    const identifier = declaration.getFirstDescendantByKind(ts.SyntaxKind.Identifier);
    if (!identifier) {
      throw new Error('Declaration node does not contain an identifier');
    }
    return identifier.getText();
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

  private isValidUsage(node: Node, variableName: string, declarationIdentifier: Node | undefined, declaration: Node): boolean {
    return this.isUsageNode(node, variableName, declarationIdentifier) && 
           this.shadowingDetector.isUsageInScope(node, declaration);
  }

  private getDeclarationIdentifier(declaration: Node): Node | undefined {
    return declaration.getFirstDescendantByKind(ts.SyntaxKind.Identifier);
  }

  private isUsageNode(node: Node, variableName: string, declarationIdentifier: Node | undefined): boolean {
    return node.getKind() === ts.SyntaxKind.Identifier && 
           node.getText() === variableName && 
           node !== declarationIdentifier;
  }
}