import { QualityCheck, QualityIssue } from '../quality-check-interface';
import { Project, MethodDeclaration, PropertyAccessExpression, CallExpression, ClassDeclaration, SyntaxKind, SourceFile } from 'ts-morph';
import * as path from 'path';
import { limitViolations } from '../violation-limiter';

export const featureEnvyCheck: QualityCheck = {
  name: 'featureEnvy',
  check: (sourceDir: string): QualityIssue[] => {
    const project = new Project();
    project.addSourceFilesAtPaths(`${sourceDir}/**/*.ts`);
    
    const issues: QualityIssue[] = [];
    const processed = new Set<string>();
    
    project.getSourceFiles().forEach(sourceFile => {
      const filePath = path.relative(process.cwd(), sourceFile.getFilePath());
      
      if (shouldSkipFile(filePath)) return;
      
      const importedSymbols = getImportedSymbols(sourceFile);
      
      sourceFile.getClasses().forEach(cls => {
        cls.getMethods().forEach(method => {
          const envy = analyzeMethodForFeatureEnvy(method, importedSymbols);
          if (envy) {
            const line = method.getStartLineNumber();
            const key = `${filePath}:${line}:${method.getName()}`;
            
            if (!processed.has(key)) {
              processed.add(key);
              issues.push({
                type: 'featureEnvy',
                severity: 'warn' as const,
                message: `Method '${method.getName()}' uses '${envy.enviedClass}' ${envy.count} times but own class only ${envy.ownUsage} times`,
                file: filePath,
                line: line
              });
            }
          }
        });
      });
    });
    
    return limitViolations(issues, 'featureEnvy', 'feature envy');
  },
  getGroupDefinition: (groupKey: string) => groupKey === 'featureEnvy' ? {
    title: 'FEATURE ENVY',
    description: 'Methods that use another class more than their own class.',
    actionGuidance: 'Consider moving these methods to the class they depend on most, or extract shared behavior.'
  } : undefined
};

interface FeatureEnvyResult {
  enviedClass: string;
  count: number;
  ownUsage: number;
}

const analyzeMethodForFeatureEnvy = (method: MethodDeclaration, importedSymbols: Set<string>): FeatureEnvyResult | null => {
  const parent = method.getParent();
  if (!parent || parent.getKind() !== SyntaxKind.ClassDeclaration) return null;
  
  const ownClassName = (parent as ClassDeclaration).getName();
  if (!ownClassName) return null;
  
  const externalUsage = new Map<string, number>();
  let ownUsage = 0;
  
  method.forEachDescendant(node => {
    if (node.getKind() === SyntaxKind.PropertyAccessExpression) {
      const propAccess = node as PropertyAccessExpression;
      const expression = propAccess.getExpression();
      
      if (expression.getKind() === SyntaxKind.ThisKeyword) {
        ownUsage++;
      } else {
        const expressionText = expression.getText();
        if (isInternalClassReference(expressionText, importedSymbols)) {
          const count = externalUsage.get(expressionText) || 0;
          externalUsage.set(expressionText, count + 1);
        }
      }
    } else if (node.getKind() === SyntaxKind.CallExpression) {
      const callExpr = node as CallExpression;
      const expression = callExpr.getExpression();
      
      if (expression.getKind() === SyntaxKind.PropertyAccessExpression) {
        const propAccess = expression as PropertyAccessExpression;
        const objectExpr = propAccess.getExpression();
        
        if (objectExpr.getKind() === SyntaxKind.ThisKeyword) {
          ownUsage++;
        } else {
          const expressionText = objectExpr.getText();
          if (isInternalClassReference(expressionText, importedSymbols)) {
            const count = externalUsage.get(expressionText) || 0;
            externalUsage.set(expressionText, count + 1);
          }
        }
      }
    }
  });
  
  for (const [className, count] of externalUsage.entries()) {
    if (count >= 3 && count > ownUsage * 1.5) {
      return {
        enviedClass: className,
        count: count,
        ownUsage: ownUsage
      };
    }
  }
  
  return null;
};

const getImportedSymbols = (sourceFile: SourceFile): Set<string> => {
  const importedSymbols = new Set<string>();
  
  sourceFile.getImportDeclarations().forEach(importDecl => {
    const moduleSpecifier = importDecl.getModuleSpecifierValue();
    
    if (isExternalModule(moduleSpecifier)) {
      importDecl.getNamedImports().forEach(namedImport => {
        importedSymbols.add(namedImport.getName());
      });
      
      const defaultImport = importDecl.getDefaultImport();
      if (defaultImport) {
        importedSymbols.add(defaultImport.getText());
      }
      
      const namespaceImport = importDecl.getNamespaceImport();
      if (namespaceImport) {
        importedSymbols.add(namespaceImport.getText());
      }
    }
  });
  
  return importedSymbols;
};

const isExternalModule = (moduleSpecifier: string): boolean => {
  return !moduleSpecifier.startsWith('.') && !moduleSpecifier.startsWith('/');
};

const isInternalClassReference = (text: string, importedSymbols: Set<string>): boolean => {
  if (!/^[a-z][a-zA-Z0-9]*$/.test(text)) return false;
  
  const builtInClasses = [
    'console', 'process', 'window', 'document', 'Math', 'Date', 'JSON', 'Object', 'Array', 'String', 'Number', 'Boolean',
    'Promise', 'Error', 'RegExp', 'Map', 'Set', 'WeakMap', 'WeakSet', 'Symbol', 'Buffer'
  ];
  
  if (builtInClasses.includes(text)) return false;
  
  if (importedSymbols.has(text)) return false;
  
  return true;
};

const shouldSkipFile = (filePath: string): boolean =>
  filePath.endsWith('.d.ts') || filePath.includes('/fixtures/');