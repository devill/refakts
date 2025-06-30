import { QualityCheck, QualityIssue, QualityGroup } from '../quality-tools/quality-check-interface';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const changeFrequencyCheck: QualityCheck = {
  name: 'changeFrequency',
  check: async (sourceDir: string): Promise<QualityIssue[]> => {
    const changeIssues = await analyzeChangeFrequency();
    const filteredIssues = await filterRecentlyFixedIssues(changeIssues);
    return filteredIssues.map(toQualityIssue);
  },
  getGroupDefinition: (groupKey: string) => {
    if (groupKey === 'changeFrequency') return {
      title: 'OPEN-CLOSED PRINCIPLE VIOLATIONS',
      description: 'Files changing frequently suggest design should be extensible without modification.',
      actionGuidance: 'Consider introducing abstractions, dependency injection, or plugin patterns to improve the design. Suggest the improvement to the user starting with the ⚠️ emoji a detailed explanation of your design suggestion.',
      requiresUserConsultation: true
    };
    if (groupKey === 'cohesiveChange') return {
      title: 'ABSTRACTION LEAKAGE',
      description: 'Files changing together suggest concerns not properly encapsulated.',
      actionGuidance: 'Consider extracting shared abstractions or reducing coupling. Suggest the improvement to the user starting with the ⚠️ emoji a detailed explanation of your design suggestion.',
      requiresUserConsultation: true
    };
    return undefined;
  }
};

const analyzeChangeFrequency = async (): Promise<string[]> => {
  try {
    const fileChanges = await analyzeFileChangeFrequency();
    const cohesiveChanges = await analyzeCohesiveChanges();
    return [...fileChanges, ...cohesiveChanges];
  } catch (error) {
    return [];
  }
};

const analyzeFileChangeFrequency = async (): Promise<string[]> => {
  const { stdout } = await execAsync('git log --oneline --name-only -100 | grep "^src/" | sort | uniq -c | sort -nr');
  return stdout.split('\n')
    .filter(line => line.trim())
    .map(line => line.trim().split(/\s+/))
    .filter(([count]) => parseInt(count) >= 10)
    .map(([count, file]) => `${file} changed ${count} times in last 100 commits`);
};

const analyzeCohesiveChanges = async (): Promise<string[]> => {
  const { stdout } = await execAsync('git log --oneline --name-only -100');
  const commits = stdout.split('\n\n').filter(Boolean);
  const filePairs = generateFilePairs(commits);
  const frequentPairs = countFilePairs(filePairs);
  
  return Array.from(frequentPairs.entries())
    .filter(([, count]) => count >= 10)
    .map(([pair, count]) => `[${pair}] change together ${count} times`);
};

const generateFilePairs = (commits: string[]): string[] => {
  const pairs: string[] = [];
  
  commits.forEach(commit => {
    const files = commit.split('\n').slice(1).filter(f => f.startsWith('src/'));
    for (let i = 0; i < files.length; i++) {
      for (let j = i + 1; j < files.length; j++) {
        const pair = [files[i], files[j]].sort().join(', ');
        pairs.push(pair);
      }
    }
  });
  
  return pairs;
};

const countFilePairs = (pairs: string[]): Map<string, number> => {
  const counts = new Map<string, number>();
  pairs.forEach(pair => counts.set(pair, (counts.get(pair) || 0) + 1));
  return counts;
};

const filterRecentlyFixedIssues = async (issues: string[]): Promise<string[]> => {
  const recentCommits = await getRecentCommitMessages(3);
  const hasQualityFix = recentCommits.some(isQualityFixCommit);
  
  return hasQualityFix ? [] : issues;
};

const getRecentCommitMessages = async (count: number): Promise<string[]> => {
  try {
    const { stdout } = await execAsync(`git log --oneline -${count} --pretty=format:"%s"`);
    return stdout.split('\n').filter(Boolean);
  } catch (error) {
    return [];
  }
};

const isQualityFixCommit = (message: string): boolean => {
  const keywords = ['refactor', 'quality', 'extract', 'simplify', 'cleanup', 'structure'];
  return keywords.some(keyword => message.toLowerCase().includes(keyword));
};

const toQualityIssue = (issue: string): QualityIssue => ({
  type: issue.includes('change together') ? 'cohesiveChange' : 'changeFrequency',
  message: issue
});