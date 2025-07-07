import * as ts from 'typescript';
import { Node, SourceFile } from 'ts-morph';
import { SourceFileHelper } from './source-file-helper';
import { ShadowingDetector } from './shadowing-detector';
import { VariableContext } from '../core/variable-context';

export class VariableNodeMatcher {
  private shadowingDetector = new ShadowingDetector();

  findDeclaration(sourceFile: SourceFile, variableName: string): Node | undefined {
    return SourceFileHelper.findDescendant(sourceFile, 
      node => this.isMatchingDeclaration(node, variableName));
  }

  findUsages(sourceFile: SourceFile, variableName: string, declaration: Node): Node[] {
    const usages: Node[] = [];
    const declarationIdentifier = this.getDeclarationIdentifier(declaration);
    const context = new VariableContext(variableName, declaration, declarationIdentifier, sourceFile);
    
    this.collectUsages(usages, context);
    
    return usages;
  }

  private collectUsages(usages: Node[], context: VariableContext): void {
    context.sourceFile.forEachDescendant((node: Node) => {
      if (this.isValidUsage(node, context)) {
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

  private isValidUsage(node: Node, context: VariableContext): boolean {
    return this.isUsageNode(node, context) && 
           this.shadowingDetector.isUsageInScope(node, context.declaration);
  }

  private getDeclarationIdentifier(declaration: Node): Node | undefined {
    return declaration.getFirstDescendantByKind(ts.SyntaxKind.Identifier);
  }

  private isUsageNode(node: Node, context: VariableContext): boolean {
    return node.getKind() === ts.SyntaxKind.Identifier && 
           node.getText() === context.variableName && 
           node !== context.declarationIdentifier;
  }
}