import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { QualityIssue } from './quality-check-interface';

interface FileBaseline {
  lastCommitId: string;
  violations: string[];
}

interface QualityBaseline {
  [filePath: string]: FileBaseline;
}

const BASELINE_FILE = '.quality-baseline.json';

export const getLastCommitId = (filePath: string): string | null => {
  try {
    const result = execSync(`git log -1 --format="%H" -- "${filePath}"`, { 
      encoding: 'utf8',
      cwd: process.cwd()
    }).trim();
    return result || null;
  } catch {
    return null;
  }
};

export const loadBaseline = (): QualityBaseline => {
  const baselinePath = join(process.cwd(), BASELINE_FILE);
  if (!existsSync(baselinePath)) {
    return {};
  }
  
  try {
    const content = readFileSync(baselinePath, 'utf8');
    return JSON.parse(content);
  } catch {
    return {};
  }
};

export const saveBaseline = (baseline: QualityBaseline): void => {
  const baselinePath = join(process.cwd(), BASELINE_FILE);
  writeFileSync(baselinePath, JSON.stringify(baseline, null, 2));
};

export const generateBaseline = (issues: QualityIssue[]): QualityBaseline => {
  const baseline: QualityBaseline = {};
  
  const blacklistedTypes = ['manyParameters', 'featureEnvy'];
  const relevantIssues = issues.filter(issue => blacklistedTypes.includes(issue.type));
  
  const fileViolations = new Map<string, Set<string>>();
  
  relevantIssues.forEach(issue => {
    const filePath = issue.file;
    if (!filePath) {
      return;
    }
    if (!fileViolations.has(filePath)) {
      fileViolations.set(filePath, new Set());
    }
    const violations = fileViolations.get(filePath);
    if (violations) {
      violations.add(issue.type);
    }
  });
  
  fileViolations.forEach((violations, filePath) => {
    const commitId = getLastCommitId(filePath);
    if (commitId) {
      baseline[filePath] = {
        lastCommitId: commitId,
        violations: Array.from(violations)
      };
    }
  });
  
  return baseline;
};

export const shouldFilterViolation = (issue: QualityIssue, baseline: QualityBaseline): boolean => {
  if (!issue.file) {
    return false;
  }
  
  const fileBaseline = baseline[issue.file];
  if (!fileBaseline) {
    return false;
  }
  
  if (!fileBaseline.violations.includes(issue.type)) {
    return false;
  }
  
  const currentCommitId = getLastCommitId(issue.file);
  return currentCommitId === fileBaseline.lastCommitId;
};

export const getBaselineStatus = (): { filePath: string; violations: string[]; changed: boolean }[] => {
  const baseline = loadBaseline();
  const status: { filePath: string; violations: string[]; changed: boolean }[] = [];
  
  Object.entries(baseline).forEach(([filePath, fileBaseline]) => {
    const currentCommitId = getLastCommitId(filePath);
    const changed = currentCommitId !== fileBaseline.lastCommitId;
    
    status.push({
      filePath,
      violations: fileBaseline.violations,
      changed
    });
  });
  
  return status;
};