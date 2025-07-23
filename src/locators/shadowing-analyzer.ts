import { Node } from 'ts-morph';
import { ScopeAnalyzer } from './scope-analyzer';
import { VariableNameOperations } from '../core/locators/variable-name-operations';
import { DeclarationFinder } from '../core/locators/declaration-finder';

export interface ShadowingContext {
  node: Node;
  variableName: string;
  targetNode: Node;
  usageScope: Node;
}

export function isShadowingDeclaration(context: ShadowingContext): boolean {
  return DeclarationFinder.isAnyDeclaration(context.node) && 
         VariableNameOperations.matchesVariableName(context.node, context.variableName) &&
         context.node !== context.targetNode &&
         ScopeAnalyzer.getNodeScope(context.node) === context.usageScope;
}

