import { Node } from 'ts-morph';
import { NodeAnalyzer } from './node-analyzer';
import { ShadowingAnalysisRequest } from '../core/locators/shadowing-analysis-request';

export class ShadowingDetector {

  isUsageInScope(usage: Node, declaration: Node): boolean {
    const variableName = NodeAnalyzer.getVariableName(declaration);
    if (!variableName) return false;
    
    const request = ShadowingAnalysisRequest.create(usage, declaration, variableName);
    return this.validateScopeContainment(request) && !this.isShadowedByDeclaration(request);
  }

  private validateScopeContainment(request: ShadowingAnalysisRequest): boolean {
    return request.validateScopeContainment();
  }

  private isShadowedByDeclaration(request: ShadowingAnalysisRequest): boolean {
    return request.isShadowedByDeclaration();
  }

}