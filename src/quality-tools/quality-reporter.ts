import { QualityIssue, QualityGroup } from './quality-check-interface';
import { groupByType, createGroup } from './report-functions';

export const generateReport = (issues: QualityIssue[]): string =>
  issues.length === 0 ? successMessage() : failureReport(issues);

const successMessage = (): string => 
  '✅ All quality checks passed';

const failureReport = (issues: QualityIssue[]): string => 
  ['❌ Quality issues detected:', ...formatGroups(issues)].join('\n\n');

const formatGroups = (issues: QualityIssue[]): string[] =>
  Array.from(groupByType(issues))
    .map(([type, groupIssues]) => createGroup(type, groupIssues))
    .filter(hasViolations)
    .map(formatGroup);

const hasViolations = (group: QualityGroup): boolean => 
  group.violations.length > 0;

const formatGroup = (group: QualityGroup): string => 
  [
    `**${group.title}**`,
    group.description,
    group.actionGuidance,
    'Violations:',
    ...group.violations.map(v => `- ${v}`)
  ].join('\n');