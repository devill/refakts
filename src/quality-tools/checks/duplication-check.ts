import { QualityCheck, QualityIssue } from '../quality-check-interface';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const duplicationCheck: QualityCheck = {
  name: 'duplication',
  check: async (): Promise<QualityIssue[]> => {
    try {
      await execAsync('npx jscpd src --threshold 10 --reporters console --silent');
      return [];
    } catch (error: any) {
      return hasDuplication(error) ? createDuplicationIssue() : [];
    }
  },
  getGroupDefinition: (groupKey: string) => groupKey === 'duplication' ? {
    title: 'CODE DUPLICATION',
    description: 'Duplicated code increases maintenance burden and error risk.',
    actionGuidance: 'Extract common functionality into shared functions or classes.'
  } : undefined
};

const hasDuplication = (error: any): boolean =>
  error.stdout?.includes('duplications found');

const createDuplicationIssue = (): QualityIssue[] => [{
  type: 'duplication',
  message: 'Code duplication detected. Look for missing abstractions - similar code patterns indicate shared concepts that should be extracted into reusable functions or classes.'
}];