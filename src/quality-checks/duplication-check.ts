import { QualityCheck, QualityIssue } from '../quality-tools/quality-check-interface';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const duplicationCheck: QualityCheck = {
  name: 'duplication',
  check: async (sourceDir: string): Promise<QualityIssue[]> => {
    try {
      await execAsync('npx jscpd src --threshold 10 --reporters console --silent');
      return [];
    } catch (error: any) {
      return hasDuplication(error) ? createDuplicationIssue() : [];
    }
  }
};

const hasDuplication = (error: any): boolean =>
  error.stdout?.includes('duplications found');

const createDuplicationIssue = (): QualityIssue[] => [{
  type: 'duplication',
  message: '👧🏻💬 Code duplication detected. Look for missing abstractions - similar code patterns indicate shared concepts that should be extracted into reusable functions or classes.'
}];