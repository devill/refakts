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
    await execAsync('npx jscpd tests --threshold 5 --reporters console');
  } catch (error: unknown) {
    if (hasDuplication(error)) {
      issues.push(...createTestDuplicationIssue(error));
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

const extractSpecificDuplications = (error?: unknown): QualityIssue[] => {
  if (!error || typeof error !== 'object') return [];
  
  const execError = error as ExecError;
  const output = execError.stdout || execError.stderr || execError.message || '';
  
  const issues: QualityIssue[] = [];
  const seenPairs = new Set<string>();
  
  if (output.includes('Clone found')) {
    const lines = output.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('Clone found (typescript):')) {
        const nextLine = lines[i + 1];
        const thirdLine = lines[i + 2];
        
        if (nextLine && thirdLine) {
          const cleanNextLine = nextLine.replace(/\[[0-9;]*m/g, '');
          const cleanThirdLine = thirdLine.replace(/\[[0-9;]*m/g, '');
          
          const file1Match = cleanNextLine.match(/- (.+?) \[/);
          const file2Match = cleanThirdLine.match(/(.+?) \[/);
          
          if (file1Match && file2Match) {
            const file1 = file1Match[1].trim();
            const file2 = file2Match[1].trim();
            
            const pairKey = [file1, file2].sort().join('|');
            if (seenPairs.has(pairKey)) continue;
            seenPairs.add(pairKey);
            
            if (file1.includes('.received') || file2.includes('.received') || 
                file1.includes('tests/fixtures/') || file2.includes('tests/fixtures/') ||
                file1.includes('tests/scripts/') || file2.includes('tests/scripts/')) {
              continue;
            }
            
            const cloneSection = [line, nextLine, thirdLine].join('\n');
            issues.push({
              type: 'duplication',
              message: cloneSection
            });
          }
        }
      }
    }
  }
  
  return issues;
};

const createTestDuplicationIssue = (error?: unknown): QualityIssue[] => {
  const specificIssues = extractSpecificDuplications(error);
  
  if (specificIssues.length > 0) {
    return specificIssues;
  }
  
  return [{
    type: 'duplication',
    message: 'Test code duplication detected. Extract common test utilities, fixture handling, or assertion patterns into shared helper functions.'
  }];
};