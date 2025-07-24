import { QualityCheck, QualityIssue } from '../quality-check-interface';
import { Project } from 'ts-morph';
import * as path from 'path';
import { ImportSymbolExtractor, FeatureEnvyDetector } from '../../../quality-tools/checks/services';

export const featureEnvyCheck: QualityCheck = {
  name: 'featureEnvy',
  check: (files: string[]): QualityIssue[] => {
    const project = new Project();
    project.addSourceFilesAtPaths(files);
    
    const issues: QualityIssue[] = [];
    const processed = new Set<string>();
    
    project.getSourceFiles().forEach(sourceFile => {
      const filePath = path.relative(process.cwd(), sourceFile.getFilePath());
      
      if (shouldSkipFile(filePath)) return;
      
      const importedSymbols = ImportSymbolExtractor.getImportedSymbols(sourceFile);
      
      sourceFile.getClasses().forEach(cls => {
        cls.getMethods().forEach(method => {
          const envy = FeatureEnvyDetector.analyzeMethodForFeatureEnvy(method, importedSymbols);
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
    
    return issues;
  },
  getGroupDefinition: (groupKey: string) => groupKey === 'featureEnvy' ? {
    title: 'FEATURE ENVY',
    description: 'Methods that use another class more than their own class.',
    actionGuidance: 'Consider moving these methods to the class they depend on most, or extract shared behavior.'
  } : undefined
};

const shouldSkipFile = (filePath: string): boolean =>
  filePath.endsWith('.d.ts') || filePath.includes('/fixtures/');