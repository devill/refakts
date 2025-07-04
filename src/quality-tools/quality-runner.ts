#!/usr/bin/env node

import { QualityIssue } from './quality-check-interface';
import { loadQualityChecks } from './plugin-loader';
import { generateReport } from './quality-reporter';

const runQualityChecks = async (sourceDir: string): Promise<QualityIssue[]> => {
  const checks = loadQualityChecks();
  const allIssues = await Promise.all(checks.map(check => check.check()));
  return allIssues.flat();
};

const main = async (): Promise<void> => {
  const issues = await runQualityChecks('src');
  const report = generateReport(issues);
  
  console.log(report);
  process.exit(issues.length > 0 ? 1 : 0);
};

if (require.main === module) {
  main().catch(console.error);
}