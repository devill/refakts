import { QualityCheck, QualityIssue } from '../quality-check-interface';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const complexityCheck: QualityCheck = {
  name: 'complexity',
  check: async (): Promise<QualityIssue[]> => {
    try {
      const { stdout } = await execAsync('npx complexity-report --format json src tests/integration tests/utils tests/unit');
      return analyzeComplexityReport(stdout);
    } catch {
      return [];
    }
  },
  getGroupDefinition: (groupKey: string) => groupKey === 'complexity' ? {
    title: 'HIGH COMPLEXITY',
    description: 'Complex functions are harder to understand, test, and maintain.',
    actionGuidance: 'Break down complex functions into smaller, single-purpose methods.'
  } : undefined
};

const analyzeComplexityReport = (stdout: string): QualityIssue[] => {
  const report = JSON.parse(stdout);
  const issues = findComplexityIssues(report);
  return createComplexityIssues(issues);
};

interface ComplexityReport {
  reports?: Array<{
    functions?: Array<{
      complexity?: { cyclomatic: number };
      params: number;
    }>;
  }>;
}

const findComplexityIssues = (report: ComplexityReport) => {
  const issues = { hasComplexFunctions: false, hasManyParams: false };
  
  for (const file of report.reports || []) {
    for (const func of file.functions || []) {
      if (func.complexity?.cyclomatic && func.complexity.cyclomatic > 5) issues.hasComplexFunctions = true;
      if (func.params > 2) issues.hasManyParams = true;
    }
  }
  
  return issues;
};

const createComplexityIssues = (issues: {hasComplexFunctions: boolean, hasManyParams: boolean}): QualityIssue[] => {
  const result: QualityIssue[] = [];
  
  if (issues.hasComplexFunctions) {
    result.push({
      type: 'complexity',
      message: 'High cyclomatic complexity detected. Break down complex functions into smaller, single-purpose methods.'
    });
  }
  
  if (issues.hasManyParams) {
    result.push({
      type: 'complexity',
      message: 'Functions with more than 2 parameters detected. Consider using parameter objects to group related parameters.'
    });
  }
  
  return result;
};