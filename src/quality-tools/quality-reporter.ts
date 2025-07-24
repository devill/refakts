import { QualityIssue, QualityGroup } from './quality-check-interface';
import { groupByType, createGroup } from './report-functions';
import { loadQualityChecks } from '../dev/quality/plugin-loader';

const VIOLATION_LIMIT = 10;

export const generateReport = (issues: QualityIssue[], noLimit = false): string =>
  issues.length === 0 ? successMessage() : failureReport(issues, noLimit);

const successMessage = (): string => 
  '✅ All quality checks passed';

const failureReport = (issues: QualityIssue[], noLimit = false): string => 
  ['❌ Quality issues detected:', ...formatGroups(issues, noLimit), 'Remember to use **refakts** for refactoring and vote on features you wish you already had.'].join('\n\n');

const formatGroups = (issues: QualityIssue[], noLimit = false): string[] =>
  Array.from(groupByType(issues))
    .map(([type, groupIssues]) => createGroup(type, noLimit ? groupIssues : limitViolationsByType(groupIssues, type)))
    .filter(hasViolations)
    .map(formatGroup);

const hasViolations = (group: QualityGroup): boolean => 
  group.violations.length > 0;

const limitViolationsByType = (issues: QualityIssue[], type: string): QualityIssue[] => {
  if (issues.length <= VIOLATION_LIMIT) {
    return issues;
  }
  
  const limitedIssues = issues.slice(0, VIOLATION_LIMIT);
  const remainingCount = issues.length - limitedIssues.length;
  const descriptiveName = getDescriptiveTypeName(type);
  
  limitedIssues.push({
    type: type,
    severity: 'warn' as const,
    message: `(${remainingCount} more ${descriptiveName} violations)`
  });
  
  return limitedIssues;
};

const getDescriptiveTypeName = (type: string): string => {
  const checks = loadQualityChecks();
  for (const check of checks) {
    if (check.getGroupDefinition) {
      const groupDef = check.getGroupDefinition(type);
      if (groupDef) {
        return extractSimpleNameFromTitle(groupDef.title);
      }
    }
  }
  
  return type;
};

const extractSimpleNameFromTitle = (title: string): string => {
  const simplifiedTitle = title.toLowerCase()
    .replace(/^(critical|high|large|too many|oversized):?\s*/i, '')
    .replace(/violations?$/, '')
    .replace(/issues?$/, '')
    .trim();
  
  const simpleMap: Record<string, string> = {
    'cyclomatic complexity': 'complexity',
    'parameters': 'parameter',
    'parameter': 'parameter',
    'functions': 'function',
    'files': 'file'
  };
  
  return simpleMap[simplifiedTitle] || simplifiedTitle;
};

const formatGroup = (group: QualityGroup): string => 
  [
    `**${group.title}**`,
    group.description,
    group.actionGuidance,
    'Violations:',
    ...group.violations.map(v => `- ${v}`)
  ].join('\n');