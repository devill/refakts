import { QualityIssue } from './quality-check-interface';
import { QualityBaseline, FileBaseline } from './baseline-types';
import { getLastCommitId } from './baseline-git';
import { loadBaseline, saveBaseline } from '../dev/quality/baseline-file-io';
import { generateBaseline, buildCurrentViolationsMap } from './baseline-violations';

export { generateBaseline, loadBaseline, saveBaseline };

const hasValidFileBaseline = (issue: QualityIssue, baseline: QualityBaseline): FileBaseline | null => {
  if (!issue.file) {
    return null;
  }
  
  const fileBaseline = baseline[issue.file];
  if (!fileBaseline || !fileBaseline.violations.includes(issue.type)) {
    return null;
  }
  
  return fileBaseline;
};

export const shouldFilterViolation = (issue: QualityIssue, baseline: QualityBaseline): boolean => {
  const fileBaseline = hasValidFileBaseline(issue, baseline);
  if (!fileBaseline || !issue.file) {
    return false;
  }
  
  const currentCommitId = getLastCommitId(issue.file);
  return currentCommitId === fileBaseline.lastCommitId;
};

const hasFileChanged = (filePath: string, fileBaseline: FileBaseline): boolean => {
  const currentCommitId = getLastCommitId(filePath);
  return currentCommitId !== fileBaseline.lastCommitId;
};

const hasBaselineViolations = (fileBaseline: FileBaseline, currentViolations: Map<string, Set<string>>, filePath: string): boolean => {
  const currentFileViolations = currentViolations.get(filePath);
  return fileBaseline.violations.some(violationType => 
    currentFileViolations?.has(violationType)
  );
};

const shouldRemoveBaselineEntry = (filePath: string, fileBaseline: FileBaseline, currentViolations: Map<string, Set<string>>): boolean => {
  if (!hasFileChanged(filePath, fileBaseline)) {
    return false;
  }
  
  return !hasBaselineViolations(fileBaseline, currentViolations, filePath);
};

const processBaselineEntry = (newBaseline: QualityBaseline, filePath: string, fileBaseline: FileBaseline, currentViolations: Map<string, Set<string>>): boolean => {
  if (shouldRemoveBaselineEntry(filePath, fileBaseline, currentViolations)) {
    delete newBaseline[filePath];
    return true;
  }
  return false;
};

const removeResolvedEntries = (baseline: QualityBaseline, currentViolations: Map<string, Set<string>>): { newBaseline: QualityBaseline; hasChanges: boolean } => {
  let hasChanges = false;
  const newBaseline = { ...baseline };
  
  Object.entries(baseline).forEach(([filePath, fileBaseline]) => {
    if (processBaselineEntry(newBaseline, filePath, fileBaseline, currentViolations)) {
      hasChanges = true;
    }
  });
  
  return { newBaseline, hasChanges };
};

export const cleanupResolvedFiles = (allIssues: QualityIssue[]): void => {
  const baseline = loadBaseline();
  const currentViolations = buildCurrentViolationsMap(allIssues);
  const { newBaseline, hasChanges } = removeResolvedEntries(baseline, currentViolations);
  
  if (hasChanges) {
    saveBaseline(newBaseline);
  }
};

const createStatusEntry = (filePath: string, fileBaseline: FileBaseline): { filePath: string; violations: string[]; changed: boolean } => {
  const currentCommitId = getLastCommitId(filePath);
  const changed = currentCommitId !== fileBaseline.lastCommitId;
  
  return {
    filePath,
    violations: fileBaseline.violations,
    changed
  };
};

export const getBaselineStatus = (): { filePath: string; violations: string[]; changed: boolean }[] => {
  const baseline = loadBaseline();
  const status: { filePath: string; violations: string[]; changed: boolean }[] = [];
  
  Object.entries(baseline).forEach(([filePath, fileBaseline]) => {
    status.push(createStatusEntry(filePath, fileBaseline));
  });
  
  return status;
};