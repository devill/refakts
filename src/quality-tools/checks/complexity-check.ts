import { QualityCheck, QualityIssue } from '../quality-check-interface';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Project } from 'ts-morph';
import * as path from 'path';

const execAsync = promisify(exec);

export const complexityCheck: QualityCheck = {
  name: 'complexity',
  check: async (sourceDir: string): Promise<QualityIssue[]> => {
    try {
      const { stdout } = await execAsync(`npx cyclomatic-complexity '${sourceDir}/**/*.ts' --json`);
      const cyclomaticIssues = analyzeCyclomaticComplexity(stdout);
      const parameterIssues = analyzeParameterCount(sourceDir);
      return [...cyclomaticIssues, ...parameterIssues];
    } catch {
      return analyzeParameterCount(sourceDir);
    }
  },
  getGroupDefinition: (groupKey: string) => {
    if (groupKey === 'cyclomaticComplexity') return {
      title: 'HIGH CYCLOMATIC COMPLEXITY',
      description: 'Complex functions are harder to understand, test, and maintain.',
      actionGuidance: 'Break down complex functions into smaller, single-purpose methods.'
    };
    if (groupKey === 'manyParameters') return {
      title: 'TOO MANY PARAMETERS',
      description: 'Functions with many parameters violate single responsibility principle.',
      actionGuidance: 'Consider grouping parameters into meaningful classes or objects.'
    };
    return undefined;
  }
};

interface CyclomaticReport {
  file: string;
  functionComplexities: Array<{
    name: string;
    complexity: number;
    line: number;
  }>;
  complexityLevel: string;
}

const analyzeCyclomaticComplexity = (stdout: string): QualityIssue[] => {
  try {
    const reports: CyclomaticReport[] = JSON.parse(stdout);
    const issues: QualityIssue[] = [];
    const processed = new Set<string>();
    
    for (const report of reports) {
      for (const func of report.functionComplexities) {
        if (func.complexity > 5) {
          const filePath = path.relative(process.cwd(), report.file);
          const key = `${filePath}:${func.line}:${func.name}`;
          
          if (!processed.has(key)) {
            processed.add(key);
            issues.push({
              type: 'cyclomaticComplexity',
              severity: 'warn' as const,
              message: `Function '${func.name}' has complexity ${func.complexity}`,
              file: filePath,
              line: func.line
            });
          }
        }
      }
    }
    
    const limitedIssues = issues.slice(0, 10);
    const remainingCount = issues.length - limitedIssues.length;
    
    if (remainingCount > 0) {
      limitedIssues.push({
        type: 'cyclomaticComplexity',
        severity: 'warn' as const,
        message: `(${remainingCount} more complexity violations)`
      });
    }
    
    return limitedIssues;
  } catch {
    return [];
  }
};

const analyzeParameterCount = (sourceDir: string): QualityIssue[] => {
  const project = new Project();
  project.addSourceFilesAtPaths(`${sourceDir}/**/*.ts`);
  
  const issues: QualityIssue[] = [];
  const processed = new Set<string>();
  
  project.getSourceFiles().forEach(sourceFile => {
    const filePath = path.relative(process.cwd(), sourceFile.getFilePath());
    
    if (shouldSkipFile(filePath)) return;
    
    sourceFile.getFunctions().forEach(func => {
      const paramCount = func.getParameters().length;
      if (paramCount > 3) {
        const name = func.getName() || 'anonymous';
        const line = func.getStartLineNumber();
        const key = `${filePath}:${line}:${name}`;
        
        if (!processed.has(key)) {
          processed.add(key);
          issues.push({
            type: 'manyParameters',
            severity: 'warn' as const,
            message: `Function '${name}' has ${paramCount} parameters`,
            file: filePath,
            line: line
          });
        }
      }
    });
    
    sourceFile.getClasses().forEach(cls => {
      cls.getMethods().forEach(method => {
        const paramCount = method.getParameters().length;
        if (paramCount > 3) {
          const name = method.getName();
          const line = method.getStartLineNumber();
          const key = `${filePath}:${line}:${name}`;
          
          if (!processed.has(key)) {
            processed.add(key);
            issues.push({
              type: 'manyParameters',
              severity: 'warn' as const,
              message: `Method '${name}' has ${paramCount} parameters`,
              file: filePath,
              line: line
            });
          }
        }
      });
    });
  });
  
  const limitedIssues = issues.slice(0, 10);
  const remainingCount = issues.length - limitedIssues.length;
  
  if (remainingCount > 0) {
    limitedIssues.push({
      type: 'manyParameters',
      severity: 'warn' as const,
      message: `(${remainingCount} more parameter violations)`
    });
  }
  
  return limitedIssues;
};

const shouldSkipFile = (filePath: string): boolean =>
  filePath.endsWith('.d.ts') || filePath.includes('/fixtures/');