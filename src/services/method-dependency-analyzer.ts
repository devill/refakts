import { MethodInfo } from '../core/services/class-method-finder';
import { PropertyAccessExpression, SyntaxKind, CallExpression } from 'ts-morph';

export interface MethodWithDependencies {
  method: MethodInfo;
  dependencies: MethodInfo[];
}

export class MethodDependencyAnalyzer {
  analyzeDependencies(methods: MethodInfo[]): MethodWithDependencies[] {
    const methodMap = new Map<string, MethodInfo>();
    methods.forEach(method => methodMap.set(method.getName(), method));

    return methods.map(method => ({
      method,
      dependencies: this.findMethodDependencies(method, methodMap)
    }));
  }

  private findMethodDependencies(method: MethodInfo, methodMap: Map<string, MethodInfo>): MethodInfo[] {
    const dependencyNames = this.extractDependencyNames(method);
    return this.resolveDependencies(dependencyNames, methodMap);
  }

  private extractDependencyNames(method: MethodInfo): Set<string> {
    const callExpressions = this.getCallExpressions(method);
    return this.collectMethodNames(callExpressions);
  }

  private getCallExpressions(method: MethodInfo): CallExpression[] {
    return method.getNode().getDescendantsOfKind(SyntaxKind.CallExpression);
  }

  private collectMethodNames(callExpressions: CallExpression[]): Set<string> {
    const dependencies = new Set<string>();
    
    for (const call of callExpressions) {
      const methodName = this.extractMethodNameFromCall(call);
      if (methodName) {
        dependencies.add(methodName);
      }
    }

    return dependencies;
  }

  private extractMethodNameFromCall(call: CallExpression): string | null {
    const expression = call.getExpression();
    
    if (expression.getKind() !== SyntaxKind.PropertyAccessExpression) {
      return null;
    }

    const propAccess = expression as PropertyAccessExpression;
    const objectName = propAccess.getExpression().getText();
    
    return objectName === 'this' ? propAccess.getName() : null;
  }

  private resolveDependencies(dependencyNames: Set<string>, methodMap: Map<string, MethodInfo>): MethodInfo[] {
    return Array.from(dependencyNames)
      .filter(name => methodMap.has(name))
      .map(name => {
        const method = methodMap.get(name);
        if (!method) {
          throw new Error(`Method '${name}' not found in method map. This should not happen since we checked methodMap.has() before adding to dependencies.`);
        }
        return method;
      });
  }
}