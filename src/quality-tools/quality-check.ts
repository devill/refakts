#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import { findComments } from './comment-detector';
import { checkFileSizes, checkFunctionSizes } from './file-size-checker';
import { checkGitDiffSize } from './git-diff-checker';
import { checkUnusedMethods } from './unused-method-checker';
import { checkChangeFrequency } from './change-frequency-checker';
import { QualityReporter, QualityIssue } from './quality-reporter';
import { getIncompleteRefactorings } from '../cli-generator';

const execAsync = promisify(exec);

interface QualityReport {
  duplication: boolean;
  complexity: boolean;
  comments: boolean;
  messages: string[];
}

async function runDuplicationCheck(): Promise<{ hasIssues: boolean; message?: string }> {
  try {
    await execAsync('npx jscpd src --threshold 10 --reporters console --silent');
    return { hasIssues: false };
  } catch (error: any) {
    return processDuplicationError(error);
  }
}

function processDuplicationError(error: any): { hasIssues: boolean; message?: string } {
  if (error.stdout && error.stdout.includes('duplications found')) {
    return { 
      hasIssues: true, 
      message: '👧🏻💬 Code duplication detected. Look for missing abstractions - similar code patterns indicate shared concepts that should be extracted into reusable functions or classes.' 
    };
  }
  return { hasIssues: false };
}

async function runComplexityCheck(): Promise<{ hasIssues: boolean; message?: string }> {
  try {
    const { stdout } = await execAsync('npx complexity-report --format json src');
    return processComplexityReport(stdout);
  } catch (error) {
    return { hasIssues: false };
  }
}

function processComplexityReport(stdout: string): { hasIssues: boolean; message?: string } {
  const report = JSON.parse(stdout);
  const issues = analyzeComplexity(report);
  const messages = createComplexityMessages(issues);
  
  return { 
    hasIssues: issues.hasComplexFunctions || issues.hasManyParams,
    message: messages.join('\n')
  };
}

function analyzeComplexity(report: any): { hasComplexFunctions: boolean; hasManyParams: boolean } {
  const issues = { hasComplexFunctions: false, hasManyParams: false };
  
  for (const file of report.reports || []) {
    checkFileComplexity(file, issues);
  }
  
  return issues;
}

function checkFileComplexity(file: any, issues: { hasComplexFunctions: boolean; hasManyParams: boolean }): void {
  for (const func of file.functions || []) {
    if (func.complexity && func.complexity.cyclomatic > 5) {
      issues.hasComplexFunctions = true;
    }
    if (func.params && func.params > 2) {
      issues.hasManyParams = true;
    }
  }
}

function createComplexityMessages(issues: { hasComplexFunctions: boolean; hasManyParams: boolean }): string[] {
  const messages: string[] = [];
  if (issues.hasComplexFunctions) {
    messages.push('👧🏻💬 High cyclomatic complexity detected. Break down complex functions into smaller, single-purpose methods.');
  }
  if (issues.hasManyParams) {
    messages.push('👧🏻💬 Functions with more than 2 parameters detected. Consider using parameter objects to group related parameters.');
  }
  return messages;
}

async function collectQualityIssues(): Promise<string[]> {
  const reporter = new QualityReporter();
  
  await addAllIssues(reporter);
  
  return [reporter.generateReport()];
}

async function addAllIssues(reporter: QualityReporter): Promise<void> {
  await addDuplicationIssues(reporter);
  await addComplexityIssues(reporter);
  addCommentIssues(reporter);
  addFileSizeIssues(reporter);
  addFunctionSizeIssues(reporter);
  addUnusedMethodIssues(reporter);
  await addDiffSizeIssues(reporter);
  await addChangeFrequencyIssues(reporter);
  addIncompleteRefactoringReminder(reporter);
}

async function addDuplicationIssues(reporter: QualityReporter): Promise<void> {
  const dupResult = await runDuplicationCheck();
  if (dupResult.hasIssues && dupResult.message) {
    reporter.addIssue({
      type: 'duplication',
      message: dupResult.message
    });
  }
}

async function addComplexityIssues(reporter: QualityReporter): Promise<void> {
  const complexityResult = await runComplexityCheck();
  if (complexityResult.hasIssues && complexityResult.message) {
    reporter.addIssue({
      type: 'complexity',
      message: complexityResult.message
    });
  }
}

function addCommentIssues(reporter: QualityReporter): void {
  const comments = findComments('src');
  if (comments.length > 0) {
    reporter.addIssue({
      type: 'comment',
      message: 'Comments found in codebase'
    });
  }
}

function addFileSizeIssues(reporter: QualityReporter): void {
  const fileSizes = checkFileSizes('src');
  for (const issue of fileSizes) {
    reporter.addIssue({
      type: 'fileSize',
      severity: issue.severity,
      message: `${issue.file} has ${issue.lines} lines`
    });
  }
}

function addFunctionSizeIssues(reporter: QualityReporter): void {
  const functionSizes = checkFunctionSizes('src');
  for (const issue of functionSizes) {
    reporter.addIssue({
      type: 'functionSize',
      severity: issue.severity,
      message: `Function '${issue.function}' in ${issue.file} has ${issue.lines} lines`
    });
  }
}

function addUnusedMethodIssues(reporter: QualityReporter): void {
  const unusedMethods = checkUnusedMethods('src');
  for (const issue of unusedMethods) {
    reporter.addIssue({
      type: 'unusedMethod',
      severity: 'critical',
      message: `Unused private method '${issue.method}' in ${issue.file} at line ${issue.line}`
    });
  }
}

async function addDiffSizeIssues(reporter: QualityReporter): Promise<void> {
  const diffResult = await checkGitDiffSize();
  if (diffResult.message) {
    reporter.addIssue({
      type: 'diffSize',
      message: diffResult.message.replace('👧🏻💬 ', '')
    });
  }
}

async function addChangeFrequencyIssues(reporter: QualityReporter): Promise<void> {
  const changeIssues = await checkChangeFrequency();
  
  for (const issue of changeIssues) {
    if (issue.includes('change together')) {
      reporter.addIssue({
        type: 'cohesiveChange',
        message: issue
      });
    } else {
      reporter.addIssue({
        type: 'changeFrequency',
        message: issue
      });
    }
  }
}

function addIncompleteRefactoringReminder(reporter: QualityReporter): void {
  const incompleteRefactorings = getIncompleteRefactorings();
  if (incompleteRefactorings.length > 0) {
    const refactoringList = incompleteRefactorings.join(', ');
    reporter.addIssue({
      type: 'incompleteRefactoring',
      message: `Consider if any incomplete refactorings should be marked complete: ${refactoringList}`
    });
  }
}

function reportResults(messages: string[]): void {
  if (messages.length === 1 && messages[0].includes('✅ All quality checks passed')) {
    console.log(messages[0]);
    process.exit(0);
  } else {
    console.log(messages[0]);
    process.exit(1);
  }
}

async function main() {
  const messages = await collectQualityIssues();
  reportResults(messages);
}

if (require.main === module) {
  main().catch(console.error);
}