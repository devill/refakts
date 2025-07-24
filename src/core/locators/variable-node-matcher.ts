import { Node, SourceFile } from 'ts-morph';
import { SourceFileHelper } from '../services/source-file-helper';
import { ShadowingDetector } from '../services/shadowing-detector';
import { VariableContext } from './variable-context';
import { NodeAnalyzer } from '../services/node-analyzer';

export class VariableNodeMatcher {
  private shadowingDetector = new ShadowingDetector();

  findDeclaration(sourceFile: SourceFile, variableName: string): Node | undefined {
    return SourceFileHelper.findDescendant(sourceFile, 
      node => NodeAnalyzer.isMatchingDeclaration(node, variableName));
  }

  findUsages(sourceFile: SourceFile, variableName: string, declaration: Node): Node[] {
    const usages: Node[] = [];
    const declarationIdentifier = NodeAnalyzer.getDeclarationIdentifier(declaration);
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
    return NodeAnalyzer.getVariableNameRequired(declaration);
  }


  private isValidUsage(node: Node, context: VariableContext): boolean {
    return NodeAnalyzer.isUsageNode(node, context.variableName, context.declarationIdentifier) && 
           this.shadowingDetector.isUsageInScope(node, context.declaration);
  }


}