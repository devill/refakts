import { QualityCheck, QualityIssue } from '../quality-tools/quality-check-interface';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const gitDiffCheck: QualityCheck = {
  name: 'diffSize',
  check: async (sourceDir: string): Promise<QualityIssue[]> => {
    const diffResult = await checkGitDiffSize();
    return diffResult.message ? [createDiffIssue(diffResult.message)] : [];
  }
};

const checkGitDiffSize = async () => {
  try {
    const { stdout } = await execAsync('git diff --stat HEAD~1 HEAD');
    const lines = stdout.split('\n');
    const summaryLine = lines[lines.length - 2];
    
    if (!summaryLine) return {};
    
    const match = summaryLine.match(/(\d+) insertions?\(\+\), (\d+) deletions?\(-\)/);
    if (!match) return {};
    
    const totalChanges = parseInt(match[1]) + parseInt(match[2]);
    
    return totalChanges > 200 ? {
      message: 'STOP! Your diff is over 200 lines. This is too much change at once. Revert to last commit and break this into smaller steps with passing tests between each step.'
    } : {};
  } catch (error) {
    return {};
  }
};

const createDiffIssue = (message: string): QualityIssue => ({
  type: 'diffSize',
  message: message.replace('👧🏻💬 ', '')
});