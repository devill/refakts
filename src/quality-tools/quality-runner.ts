#!/usr/bin/env node

import { QualityIssue } from './quality-check-interface';
import { loadQualityChecks } from './plugin-loader';
import { generateReport } from './quality-reporter';
import fs from 'fs';
import path from 'path';

const runQualityChecks = async (sourceDir: string): Promise<QualityIssue[]> => {
  const checks = loadQualityChecks();
  const allIssues = await Promise.all(checks.map(check => check.check(sourceDir)));
  return allIssues.flat();
};

const getToleranceFilePath = (): string => {
  return path.join(process.cwd(), '.linter-tolerance');
};

const getInitialToleranceCount = (): number => {
  // Default starting point - you mentioned about 100 errors currently
  return 100;
};

const getHoursSinceStart = (startTime: number): number => {
  return Math.floor((Date.now() - startTime) / (1000 * 60 * 60));
};

const getCurrentTolerance = (): number => {
  const toleranceFile = getToleranceFilePath();
  
  if (!fs.existsSync(toleranceFile)) {
    // First time running - create tolerance file with current timestamp
    const initialData = {
      startTime: Date.now(),
      initialCount: getInitialToleranceCount()
    };
    fs.writeFileSync(toleranceFile, JSON.stringify(initialData, null, 2));
    return initialData.initialCount;
  }
  
  try {
    const data = JSON.parse(fs.readFileSync(toleranceFile, 'utf8'));
    const hoursPassed = getHoursSinceStart(data.startTime);
    const currentTolerance = Math.max(0, data.initialCount - hoursPassed);
    return currentTolerance;
  } catch {
    // If file is corrupted, reset with current values
    const initialData = {
      startTime: Date.now(),
      initialCount: getInitialToleranceCount()
    };
    fs.writeFileSync(toleranceFile, JSON.stringify(initialData, null, 2));
    return initialData.initialCount;
  }
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
  const issues = await runQualityChecks('src');
  
  // Separate linter issues from other quality issues
  const linterIssues = issues.filter(issue => issue.type === 'linter-violation' || issue.type === 'linter-error');
  const otherIssues = issues.filter(issue => issue.type !== 'linter-violation' && issue.type !== 'linter-error');
  
  // Check if linter violations exceed tolerance
  const shouldFailOnLinter = shouldFailOnLinterIssues(linterIssues);
  
  // Filter out tolerated linter violations from the report
  const reportIssues = shouldFailOnLinter ? issues : otherIssues.concat(linterIssues.filter(issue => issue.type === 'linter-error'));
  
  const report = generateReport(reportIssues);
  process.stdout.write(report + '\n');
  
  // Always fail on non-linter issues and linter errors (not violations)
  const shouldFailOnOther = otherIssues.length > 0 || linterIssues.some(issue => issue.type === 'linter-error');
  
  process.exit((shouldFailOnOther || shouldFailOnLinter) ? 1 : 0);
};

if (require.main === module) {
  main().catch(error => {
    process.stderr.write(`Error: ${error}\n`);
    process.exit(1);
  });
}