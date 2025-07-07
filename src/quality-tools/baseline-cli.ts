#!/usr/bin/env node

import { program } from 'commander';
import { loadQualityChecks } from './plugin-loader';
import { generateBaseline, saveBaseline, getBaselineStatus } from './baseline-manager';
import { QualityIssue } from './quality-check-interface';

const runQualityChecks = async (sourceDir: string): Promise<QualityIssue[]> => {
  const checks = loadQualityChecks();
  const allIssues = await Promise.all(checks.map(check => check.check(sourceDir)));
  return allIssues.flat();
};

const generateCommand = async (): Promise<void> => {
  process.stdout.write('Generating quality baseline...\n');
  
  const srcIssues = await runQualityChecks('src');
  const testIssues = await runQualityChecks('tests');
  const allIssues = [...srcIssues, ...testIssues];
  
  const baseline = generateBaseline(allIssues);
  saveBaseline(baseline);
  
  const fileCount = Object.keys(baseline).length;
  const violationCount = Object.values(baseline).reduce((acc, file) => acc + file.violations.length, 0);
  
  process.stdout.write(`✅ Baseline generated with ${fileCount} files and ${violationCount} violations blacklisted\n`);
  process.stdout.write('Files with violations will be ignored until modified\n');
};

const statusCommand = (): void => {
  const status = getBaselineStatus();
  
  if (status.length === 0) {
    process.stdout.write('No baseline found. Run "npm run quality:baseline:generate" to create one.\n');
    return;
  }
  
  process.stdout.write(`📊 Quality Baseline Status\n\n`);
  
  const unchanged = status.filter(s => !s.changed);
  const changed = status.filter(s => s.changed);
  
  if (unchanged.length > 0) {
    process.stdout.write(`🔒 Blacklisted files (${unchanged.length}):\n`);
    unchanged.forEach(file => {
      process.stdout.write(`  ${file.filePath} (${file.violations.join(', ')})\n`);
    });
    process.stdout.write('\n');
  }
  
  if (changed.length > 0) {
    process.stdout.write(`⚠️  Modified files that need fixing (${changed.length}):\n`);
    changed.forEach(file => {
      process.stdout.write(`  ${file.filePath} (${file.violations.join(', ')})\n`);
    });
    process.stdout.write('\n');
  }
  
  const totalViolations = status.reduce((acc, file) => acc + file.violations.length, 0);
  process.stdout.write(`Total: ${status.length} files, ${totalViolations} violations\n`);
};

const main = (): void => {
  program
    .name('baseline-cli')
    .description('Manage quality violation baseline');
  
  program
    .command('generate')
    .description('Generate baseline from current violations')
    .action(generateCommand);
  
  program
    .command('status')
    .description('Show baseline status')
    .action(statusCommand);
  
  program.parse();
};

if (require.main === module) {
  main();
}