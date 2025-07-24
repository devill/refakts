import { QualityCheck, QualityIssue } from '../quality-check-interface';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Project } from 'ts-morph';
import * as path from 'path';

const execAsync = promisify(exec);

export const complexityCheck: QualityCheck = {
  name: 'complexity',
  check: async (files: string[]): Promise<QualityIssue[]> => {
    try {
      const fileArgs = files.map(f => `'${f}'`).join(' ');
      const { stdout } = await execAsync(`npx cyclomatic-complexity ${fileArgs} --json`);
      const cyclomaticIssues = analyzeCyclomaticComplexity(stdout);
      const parameterIssues = analyzeParameterCountFromFiles(files);
      return [...cyclomaticIssues, ...parameterIssues];
    } catch {
      return analyzeParameterCountFromFiles(files);
    }
  },
  getGroupDefinition: (groupKey: string) => {
    if (groupKey === 'cyclomaticComplexity') return {
      title: 'HIGH CYCLOMATIC COMPLEXITY',
      description: 'Complex functions are harder to understand, test, and maintain.',
      actionGuidance: 'High complexity often indicates multiple responsibilities. Look for: (1) Decision trees that could be strategy patterns, (2) Multiple concerns that belong in separate methods, (3) State machines that could be explicit classes. Focus on extracting meaningful abstractions, not just reducing complexity metrics. If the code has many misplaced responsibilities you may need to first inline methods to see the whole picture and find a better way of redistributing functionality. Think of this when reducing complexity seems particularly hard. Taking a step backwards may open up new, better possibilities.'
    };
    if (groupKey === 'manyParameters') return {
      title: 'TOO MANY PARAMETERS',
      description: 'Functions with many parameters violate single responsibility principle.',
      actionGuidance: 'Before grouping parameters: (1) Should this method actually belong ON the parameter object as a class method? (2) For static methods with many parameters - this is often a class waiting to happen. (3) Group cohesive data into meaningful objects and pass those around, even if some methods don\'t need every field. Favor declarative style over many locals.'
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
        if (func.complexity > 10 && !isGeneratedFunction(func.name)) {
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
    
    return issues;
  } catch {
    return [];
  }
};

const isGeneratedFunction = (name: string): boolean => {
  const generatedPatterns = [
    'step',           // TypeScript async/await generator step function
    '__generator',    // TypeScript generator function
    '__awaiter',      // TypeScript async function wrapper
    '__spreadArray',  // TypeScript spread operator function
    'fulfilled',      // Promise polyfill function
    'rejected',       // Promise polyfill function
    'adopt',          // Promise polyfill function
    'anonymous: P',   // Promise constructor wrapper
    'anonymous: Promise', // Promise wrapper
    'anonymous: sent',    // Generator sent wrapper
    'verb',           // TypeScript verb function
    'anonymous: n',   // Generic anonymous wrapper
    'anonymous: iterator' // Iterator wrapper
  ];
  
  return generatedPatterns.some(pattern => 
    name === pattern || 
    name.startsWith(`anonymous: ${pattern}`) ||
    (name.startsWith('anonymous:') && generatedPatterns.some(p => name.includes(p)))
  );
};


const analyzeParameterCountFromFiles = (files: string[]): QualityIssue[] => {
  const project = new Project();
  project.addSourceFilesAtPaths(files);
  
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
  
  return issues;
};

const shouldSkipFile = (filePath: string): boolean =>
  filePath.endsWith('.d.ts') || filePath.includes('/fixtures/');