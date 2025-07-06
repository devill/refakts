import { QualityCheck, QualityIssue } from '../quality-check-interface';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface ExecError extends Error {
  stdout?: string;
  stderr?: string;
}

export const duplicationCheck: QualityCheck = {
  name: 'duplication',
  check: async (): Promise<QualityIssue[]> => {
    const issues: QualityIssue[] = [];
    
    try {
      await execAsync('npx jscpd src tests --threshold 10 --reporters console --silent');
    } catch (error: unknown) {
      if (hasDuplication(error)) {
        issues.push(...createDuplicationIssue());
      }
    }
    
    try {
      await execAsync('npx jscpd tests --threshold 5 --reporters console --silent');
    } catch (error: unknown) {
      if (hasDuplication(error)) {
        issues.push(...createTestDuplicationIssue());
      }
    }
    
    return issues;
  },
  getGroupDefinition: (groupKey: string) => groupKey === 'duplication' ? {
    title: 'CODE DUPLICATION',
    description: 'Duplicated code increases maintenance burden and error risk.',
    actionGuidance: 'Extract common functionality into shared functions or classes.'
  } : undefined
};

const hasDuplication = (error: unknown): boolean => {
  if (error && typeof error === 'object') {
    const execError = error as ExecError;
    return (execError.stdout?.includes('duplications found') ?? false) ||
           (execError.stderr?.includes('too many duplicates') ?? false) ||
           (execError.message?.includes('too many duplicates') ?? false);
  }
  return false;
};

const createDuplicationIssue = (): QualityIssue[] => [{
  type: 'duplication',
  message: 'Code duplication detected. Look for missing abstractions - similar code patterns indicate shared concepts that should be extracted into reusable functions or classes.'
}];

const createTestDuplicationIssue = (): QualityIssue[] => [{
  type: 'duplication',
  message: 'Test code duplication detected. Extract common test utilities, fixture handling, or assertion patterns into shared helper functions.'
}];