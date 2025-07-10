import { Node } from 'ts-morph';
import { ScopeAnalyzer } from './ScopeAnalyzer';
import { VariableNameOperations } from './VariableNameOperations';
import { DeclarationFinder } from './DeclarationFinder';

export interface ShadowingContext {
  node: Node;
  variableName: string;
  targetNode: Node;
  usageScope: Node;
}

export class ShadowingAnalyzer {
  static isShadowingDeclaration(context: ShadowingContext): boolean {
    return DeclarationFinder.isAnyDeclaration(context.node) && 
           VariableNameOperations.matchesVariableName(context.node, context.variableName) &&
           context.node !== context.targetNode &&
           ScopeAnalyzer.getNodeScope(context.node) === context.usageScope;
  }
}