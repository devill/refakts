import { QualityIssue } from './quality-check-interface';

const VIOLATION_LIMIT = 10;

export const limitViolations = (issues: QualityIssue[], type: string, descriptiveName?: string): QualityIssue[] => {
  if (issues.length <= VIOLATION_LIMIT) {
    return issues;
  }
  
  const limitedIssues = issues.slice(0, VIOLATION_LIMIT);
  const remainingCount = issues.length - limitedIssues.length;
  const displayName = descriptiveName || type;
  
  limitedIssues.push({
    type: type,
    severity: 'warn' as const,
    message: `(${remainingCount} more ${displayName} violations)`
  });
  
  return limitedIssues;
};