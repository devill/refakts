import {QualityGroup, QualityIssue} from '../dev/quality/quality-check-interface';
import {loadQualityChecks} from '../dev/quality/plugin-loader';
import * as path from 'path';

export const formatIssue = (issue: QualityIssue): string => {
  if (issue.file && issue.line) {
    const absolutePath = path.isAbsolute(issue.file) ? issue.file : path.resolve(process.cwd(), issue.file);
    return `${absolutePath}:${issue.line} - ${issue.message}`;
  }
  if (issue.file) {
    const absolutePath = path.isAbsolute(issue.file) ? issue.file : path.resolve(process.cwd(), issue.file);
    return `${absolutePath} - ${issue.message}`;
  }
  return issue.message;
};

export const groupByType = (issues: QualityIssue[]): Map<string, QualityIssue[]> =>
  issues.reduce((groups, issue) => {
    const key = getGroupKey(issue);
    return groups.set(key, [...(groups.get(key) || []), issue]);
  }, new Map<string, QualityIssue[]>());

export const createGroup = (type: string, issues: QualityIssue[]): QualityGroup => {
  const groupDef = getGroupDefinition(type);
  return {
    ...groupDef,
    actionGuidance: `👧🏻💬 ${groupDef.actionGuidance}`,
    violations: issues.map(formatIssue)
  };
};

const getGroupKey = (issue: QualityIssue): string => {
  if (issue.type === 'fileSize') return issue.severity === 'critical' ? 'criticalFiles' : 'largeFiles';
  if (issue.type === 'functionSize') return issue.severity === 'critical' ? 'criticalFunctions' : 'largeFunctions';
  return issue.type;
};

const getGroupDefinition = (type: string): Omit<QualityGroup, 'violations'> => {
  const checks = loadQualityChecks();
  for (const check of checks) {
    if (check.getGroupDefinition) {
      const groupDef = check.getGroupDefinition(type);
      if (groupDef) return groupDef;
    }
  }
  return defaultGroup;
};


const defaultGroup: Omit<QualityGroup, 'violations'> = {
  title: 'OTHER ISSUES',
  description: 'Miscellaneous quality issues detected.',
  actionGuidance: 'Address these issues as appropriate.'
};