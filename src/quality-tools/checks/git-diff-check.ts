import { QualityCheck, QualityIssue } from '../quality-check-interface';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

let gitDiffChecked = false;
let gitDiffResult: QualityIssue[] = [];

export const gitDiffCheck: QualityCheck = {
  name: 'diffSize',
  check: async (): Promise<QualityIssue[]> => {
    if (gitDiffChecked) {
      return [];
    }
    
    gitDiffChecked = true;
    const diffResult = await checkGitDiffSize();
    gitDiffResult = diffResult.message ? [createDiffIssue(diffResult.message)] : [];
    return gitDiffResult;
  },
  getGroupDefinition: (groupKey: string) => groupKey === 'diffSize' ? {
    title: 'LARGE CHANGES',
    description: 'Large diffs are harder to review and more likely to introduce bugs.',
    actionGuidance: 'Commit smaller incremental changes with passing tests to maintain code quality.'
  } : undefined
};

const checkGitDiffSize = async () => {
  try {
    const { stdout } = await execAsync('git diff --stat');
    const lines = stdout.split('\n');
    const summaryLine = lines[lines.length - 2];
    
    if (!summaryLine) return {};
    
    const match = summaryLine.match(/(\d+) insertions?\(\+\), (\d+) deletions?\(-\)/);
    if (!match) return {};
    
    const totalChanges = parseInt(match[1]) + parseInt(match[2]);
    
    return totalChanges > 200 ? {
      message: 'STOP! Your diff is over 200 lines. This is too much change at once. Revert to last commit and break this into smaller steps with passing tests between each step.'
    } : {};
  } catch {
    return {};
  }
};

const createDiffIssue = (message: string): QualityIssue => ({
  type: 'diffSize',
  message: message
});