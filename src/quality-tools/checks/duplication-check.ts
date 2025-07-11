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
  check: async (_files: string[]): Promise<QualityIssue[]> => {
    const issues: QualityIssue[] = [];
    
    await checkSourceCodeDuplication(issues);
    await checkTestCodeDuplication(issues);
    
    return issues;
  },
  getGroupDefinition: (groupKey: string) => groupKey === 'duplication' ? {
    title: 'CODE DUPLICATION',
    description: 'Duplicated code increases maintenance burden and error risk.',
    actionGuidance: 'Extract common functionality into shared functions or classes.'
  } : undefined
};

const checkSourceCodeDuplication = async (issues: QualityIssue[]): Promise<void> => {
  try {
    await execAsync('npx jscpd src tests --threshold 10 --reporters console --silent');
  } catch (error: unknown) {
    if (hasDuplication(error)) {
      issues.push(...createDuplicationIssue());
    }
  }
};

const checkTestCodeDuplication = async (issues: QualityIssue[]): Promise<void> => {
  try {
    await execAsync('npx jscpd tests --threshold 5 --reporters console --silent --ignore "tests/fixtures/**" --ignore "tests/scripts/**"');
  } catch (error: unknown) {
    if (hasDuplication(error)) {
      issues.push(...createTestDuplicationIssue());
    }
  }
};

const hasDuplication = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  
  const execError = error as ExecError;
  return hasDuplicationInOutput(execError.stdout) ||
         hasDuplicationInOutput(execError.stderr) ||
         hasDuplicationInOutput(execError.message);
};

const hasDuplicationInOutput = (output?: string): boolean => {
  if (!output) return false;
  return output.includes('duplications found') || output.includes('too many duplicates');
};

const createDuplicationIssue = (): QualityIssue[] => [{
  type: 'duplication',
  message: 'Code duplication detected. Look for missing abstractions - similar code patterns indicate shared concepts that should be extracted into reusable functions or classes.'
}];

const createTestDuplicationIssue = (): QualityIssue[] => [{
  type: 'duplication',
  message: 'Test code duplication detected. Extract common test utilities, fixture handling, or assertion patterns into shared helper functions.'
}];