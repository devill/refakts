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
    try {
      await execAsync('npx jscpd src --threshold 10 --reporters console --silent');
      return [];
    } catch (error: unknown) {
      return hasDuplication(error) ? createDuplicationIssue() : [];
    }
  },
  getGroupDefinition: (groupKey: string) => groupKey === 'duplication' ? {
    title: 'CODE DUPLICATION',
    description: 'Duplicated code increases maintenance burden and error risk.',
    actionGuidance: 'Extract common functionality into shared functions or classes.'
  } : undefined
};

const hasDuplication = (error: unknown): boolean => {
  if (error && typeof error === 'object' && 'stdout' in error) {
    const execError = error as ExecError;
    return execError.stdout?.includes('duplications found') ?? false;
  }
  return false;
};

const createDuplicationIssue = (): QualityIssue[] => [{
  type: 'duplication',
  message: 'Code duplication detected. Look for missing abstractions - similar code patterns indicate shared concepts that should be extracted into reusable functions or classes.'
}];