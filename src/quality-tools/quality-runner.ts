#!/usr/bin/env node

import { QualityIssue } from './quality-check-interface';
import { loadQualityChecks } from './plugin-loader';
import { generateReport } from './quality-reporter';
const runQualityChecks = async (sourceDir: string): Promise<QualityIssue[]> => {
  const checks = loadQualityChecks();
  const allIssues = await Promise.all(checks.map(check => check.check(sourceDir)));
  return allIssues.flat();
};

const getCurrentTolerance = (): number => {
  return 0;
};

const shouldFailOnLinterIssues = (linterIssues: QualityIssue[]): boolean => {
  const tolerance = getCurrentTolerance();
  const linterViolationCount = linterIssues.filter(issue => 
    issue.type === 'linter-violation'
  ).length;
  
  if (linterViolationCount <= tolerance) {
    if (tolerance > 0 && linterViolationCount > 0) {
      process.stdout.write(`\n📊 Linter status: ${linterViolationCount}/${tolerance} violations allowed (${tolerance - linterViolationCount} buffer remaining)\n`);
    } else if (linterViolationCount === 0) {
      process.stdout.write(`\n✅ No linter violations found!\n`);
    }
    return false;
  }
  
  process.stdout.write(`\n❌ Linter violations exceed tolerance: ${linterViolationCount} violations found, only ${tolerance} allowed\n`);
  if (tolerance === 0) {
    process.stdout.write('🎯 Zero tolerance reached! All linter violations must be fixed.\n');
  }
  return true;
};

const main = async (): Promise<void> => {
  const srcIssues = await runQualityChecks('src');
  const testIssues = await runQualityChecks('tests');
  const issues = [...srcIssues, ...testIssues];
  
  const linterIssues = issues.filter(issue => issue.type === 'linter-violation' || issue.type === 'linter-error');
  const otherIssues = issues.filter(issue => issue.type !== 'linter-violation' && issue.type !== 'linter-error');
  
  const shouldFailOnLinter = shouldFailOnLinterIssues(linterIssues);
  
  const reportIssues = shouldFailOnLinter ? issues : otherIssues.concat(linterIssues.filter(issue => issue.type === 'linter-error'));
  
  const report = generateReport(reportIssues);
  process.stdout.write(report + '\n');
  
  const shouldFailOnOther = otherIssues.length > 0 || linterIssues.some(issue => issue.type === 'linter-error');
  
  process.exit((shouldFailOnOther || shouldFailOnLinter) ? 1 : 0);
};

if (require.main === module) {
  main().catch(error => {
    process.stderr.write(`Error: ${error}\n`);
    process.exit(1);
  });
}