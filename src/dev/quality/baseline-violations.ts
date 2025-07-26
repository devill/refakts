import { QualityIssue } from './quality-check-interface';
import { QualityBaseline, FileBaseline } from './baseline-types';
import { getLastCommitId } from './baseline-git';

const getBlacklistedTypes = (): string[] => {
  return ['manyParameters', 'featureEnvy', 'fileSize', 'functionSize', 'comment', 'singleUseVariable'];
};

const addViolationToMap = (violations: Map<string, Set<string>>, filePath: string, issueType: string): void => {
  if (!violations.has(filePath)) {
    violations.set(filePath, new Set());
  }
  const fileViolations = violations.get(filePath);
  if (fileViolations) {
    fileViolations.add(issueType);
  }
};

const buildFileViolationsMap = (issues: QualityIssue[]): Map<string, Set<string>> => {
  const fileViolations = new Map<string, Set<string>>();
  
  issues.forEach(issue => {
    if (issue.file) {
      addViolationToMap(fileViolations, issue.file, issue.type);
    }
  });
  
  return fileViolations;
};

const createBaselineEntry = (filePath: string, violations: Set<string>): FileBaseline | null => {
  const commitId = getLastCommitId(filePath);
  return commitId ? {
    lastCommitId: commitId,
    violations: Array.from(violations)
  } : null;
};

const buildBaselineFromViolations = (fileViolations: Map<string, Set<string>>): QualityBaseline => {
  const baseline: QualityBaseline = {};
  
  fileViolations.forEach((violations, filePath) => {
    const entry = createBaselineEntry(filePath, violations);
    if (entry) {
      baseline[filePath] = entry;
    }
  });
  
  return baseline;
};

export const generateBaseline = (issues: QualityIssue[]): QualityBaseline => {
  return buildBaselineFromViolations(buildFileViolationsMap(issues.filter(issue => getBlacklistedTypes().includes(issue.type))));
};

const filterRelevantIssues = (issues: QualityIssue[]): QualityIssue[] => {
  return issues.filter(issue => getBlacklistedTypes().includes(issue.type) && issue.file);
};

export const buildCurrentViolationsMap = (issues: QualityIssue[]): Map<string, Set<string>> => {
  const currentViolations = new Map<string, Set<string>>();
  filterRelevantIssues(issues).forEach(issue => {
    addViolationToMap(currentViolations, issue.file as string, issue.type);
  });
  
  return currentViolations;
};