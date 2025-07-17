import { QualityCheck, QualityIssue } from '../quality-check-interface';
import { Project, SyntaxKind, SourceFile, Node } from 'ts-morph';
import * as path from 'path';

export const consoleUsageCheck: QualityCheck = {
  name: 'console-usage',
  check: (files: string[]): QualityIssue[] => {
    const project = new Project();
    project.addSourceFilesAtPaths(files);
    
    return project.getSourceFiles().flatMap(findConsoleUsageInFile);
  },
  getGroupDefinition: (groupKey: string) => groupKey === 'console-usage' ? {
    title: 'DIRECT CONSOLE USAGE DETECTED',
    description: 'Direct console.log/error and process.stdout.write usage bypasses ConsoleOutput abstraction.',
    actionGuidance: 'Use injected ConsoleOutput interface instead of direct console calls. Replace console.log with this.consoleOutput.log and process.stdout.write with this.consoleOutput.write.'
  } : undefined
};

const findConsoleUsageInFile = (sourceFile: SourceFile): QualityIssue[] => {
  const filePath = path.relative(process.cwd(), sourceFile.getFilePath());
  
  if (shouldSkipFile(filePath)) return [];
  
  const issues: QualityIssue[] = [];
  
  sourceFile.forEachDescendant(node => {
    if (node.getKind() === SyntaxKind.PropertyAccessExpression) {
      const propertyAccess = node.asKindOrThrow(SyntaxKind.PropertyAccessExpression);
      const expressionText = propertyAccess.getExpression().getText();
      const propertyName = propertyAccess.getName();
      
      if (isDirectConsoleUsage(expressionText, propertyName)) {
        issues.push(createConsoleUsageIssue(filePath, node, expressionText, propertyName));
      }
    }
  });
  
  return issues;
};

const isDirectConsoleUsage = (expression: string, property: string): boolean => {
  return (expression === 'console' && (property === 'log' || property === 'error')) ||
         (expression === 'process.stdout' && property === 'write');
};

const createConsoleUsageIssue = (filePath: string, node: Node, expression: string, property: string): QualityIssue => ({
  type: 'console-usage',
  message: `Direct ${expression}.${property} usage should use ConsoleOutput interface instead`,
  file: filePath,
  line: node.getStartLineNumber()
});

const shouldSkipFile = (filePath: string): boolean =>
  filePath.endsWith('.d.ts') || 
  filePath.includes('/fixtures/') ||
  filePath.includes('/interfaces/StandardConsole.ts') ||
  filePath.includes('/interfaces/FakeConsole.ts') ||
  filePath.includes('/utils/console-capture.ts');