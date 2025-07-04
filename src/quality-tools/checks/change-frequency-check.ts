import { QualityCheck, QualityIssue } from '../quality-check-interface';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const changeFrequencyCheck: QualityCheck = {
  name: 'changeFrequency',
  check: async (): Promise<QualityIssue[]> => {
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
    const recentlyChangedFiles = await getRecentlyChangedFiles();
    if (recentlyChangedFiles.length === 0) return [];
    
    const fileChanges = await analyzeFileChangeFrequency(recentlyChangedFiles);
    const cohesiveChanges = await analyzeCohesiveChanges(recentlyChangedFiles);
    return [...fileChanges, ...cohesiveChanges];
  } catch {
    return [];
  }
};

const getRecentlyChangedFiles = async (): Promise<string[]> => {
  const { stdout } = await execAsync('git log --oneline --name-only -2');
  return stdout.split('\n')
    .filter(line => line.startsWith('src/'))
    .filter((file, index, array) => array.indexOf(file) === index);
};

const analyzeFileChangeFrequency = async (recentlyChangedFiles: string[]): Promise<string[]> => {
  const { stdout } = await execAsync('git log --oneline --name-only -100 | grep "^src/" | sort | uniq -c | sort -nr');
  return stdout.split('\n')
    .filter(line => line.trim())
    .map(line => line.trim().split(/\s+/))
    .filter(([count, file]) => parseInt(count) >= 10 && recentlyChangedFiles.includes(file))
    .map(([count, file]) => `${file} changed ${count} times in last 100 commits`);
};

const analyzeCohesiveChanges = async (recentlyChangedFiles: string[]): Promise<string[]> => {
  const { stdout } = await execAsync('git log --oneline --name-only -100');
  const commits = stdout.split('\n\n').filter(Boolean);
  
  const fileAges = await getFileAges(recentlyChangedFiles);
  const matureFiles = recentlyChangedFiles.filter(file => (fileAges.get(file) || 0) >= 20);
  
  if (matureFiles.length < 2) return [];
  
  const filePairs = generateFilePairs(commits, matureFiles);
  const frequentPairs = countFilePairs(filePairs);
  
  return Array.from(frequentPairs.entries())
    .filter(([, count]) => count >= 10)
    .map(([pair, count]) => `[${pair}] change together ${count} times`);
};

const generateFilePairs = (commits: string[], recentlyChangedFiles: string[]): string[] => {
  const pairs: string[] = [];
  
  commits.forEach(commit => {
    const files = commit.split('\n').slice(1).filter(f => f.startsWith('src/'));
    for (let i = 0; i < files.length; i++) {
      for (let j = i + 1; j < files.length; j++) {
        if (recentlyChangedFiles.includes(files[i]) || recentlyChangedFiles.includes(files[j])) {
          const pair = [files[i], files[j]].sort().join(', ');
          pairs.push(pair);
        }
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
  const recentCommits = await getRecentCommitMessages(5);
  const hasQualityFix = recentCommits.some(isQualityFixCommit);
  
  if (hasQualityFix) {
    return issues.filter(issue => !isLikelyFalsePositive(issue, recentCommits));
  }
  return issues;
};

const getRecentCommitMessages = async (count: number): Promise<string[]> => {
  try {
    const { stdout } = await execAsync(`git log --oneline -${count} --pretty=format:"%s"`);
    return stdout.split('\n').filter(Boolean);
  } catch {
    return [];
  }
};

const isQualityFixCommit = (message: string): boolean => {
  const keywords = ['refactor', 'quality', 'extract', 'simplify', 'cleanup', 'structure', 'break down', 'break', 'functions'];
  return keywords.some(keyword => message.toLowerCase().includes(keyword));
};

const getFileAges = async (files: string[]): Promise<Map<string, number>> => {
  const ages = new Map<string, number>();
  
  for (const file of files) {
    try {
      const { stdout } = await execAsync(`git log --oneline --follow "${file}" | wc -l`);
      ages.set(file, parseInt(stdout.trim()) || 0);
    } catch {
      ages.set(file, 0);
    }
  }
  
  return ages;
};

const isLikelyFalsePositive = (issue: string, recentCommits: string[]): boolean => {
  const hasRecentRefactoring = recentCommits.some(commit => 
    isQualityFixCommit(commit) && commit.toLowerCase().includes('function')
  );
  
  return hasRecentRefactoring && issue.includes('change together') && 
         parseInt(issue.match(/(\d+) times$/)?.[1] || '0') < 20;
};

const toQualityIssue = (issue: string): QualityIssue => ({
  type: issue.includes('change together') ? 'cohesiveChange' : 'changeFrequency',
  message: issue
});