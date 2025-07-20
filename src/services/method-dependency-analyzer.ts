import { MethodInfo } from './class-method-finder';
import { PropertyAccessExpression, SyntaxKind } from 'ts-morph';

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
    const dependencies = new Set<string>();
    const node = method.getNode();

    // Find all this.methodName() calls
    const callExpressions = node.getDescendantsOfKind(SyntaxKind.CallExpression);
    
    for (const call of callExpressions) {
      const expression = call.getExpression();
      
      if (expression.getKind() === SyntaxKind.PropertyAccessExpression) {
        const propAccess = expression as PropertyAccessExpression;
        const objectName = propAccess.getExpression().getText();
        
        if (objectName === 'this') {
          const methodName = propAccess.getName();
          if (methodMap.has(methodName)) {
            dependencies.add(methodName);
          }
        }
      }
    }

    return Array.from(dependencies).map(name => {
      const method = methodMap.get(name);
      if (!method) {
        throw new Error(`Method '${name}' not found in method map. This should not happen since we checked methodMap.has() before adding to dependencies.`);
      }
      return method;
    });
  }
}