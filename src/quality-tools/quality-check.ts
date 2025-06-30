#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import { findComments } from './comment-detector';
import { checkFileSizes, checkFunctionSizes } from './file-size-checker';
import { checkGitDiffSize } from './git-diff-checker';
import { checkUnusedMethods } from './unused-method-checker';
import { checkChangeFrequency } from './change-frequency-checker';
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
  const messages: string[] = [];
  
  await addAllIssues(messages);
  
  return messages;
}

async function addAllIssues(messages: string[]): Promise<void> {
  await addDuplicationIssues(messages);
  await addComplexityIssues(messages);
  addCommentIssues(messages);
  addFileSizeIssues(messages);
  addFunctionSizeIssues(messages);
  addUnusedMethodIssues(messages);
  await addDiffSizeIssues(messages);
  await addChangeFrequencyIssues(messages);
  addIncompleteRefactoringReminder(messages);
}

async function addDuplicationIssues(messages: string[]): Promise<void> {
  const dupResult = await runDuplicationCheck();
  if (dupResult.hasIssues && dupResult.message) {
    messages.push(dupResult.message);
  }
}

async function addComplexityIssues(messages: string[]): Promise<void> {
  const complexityResult = await runComplexityCheck();
  if (complexityResult.hasIssues && complexityResult.message) {
    messages.push(complexityResult.message);
  }
}

function addCommentIssues(messages: string[]): void {
  const comments = findComments('src');
  if (comments.length > 0) {
    messages.push('👧🏻💬 **NEVER** use comments to explain code, the code should speak for itself. Extract complex logic into well-named functions instead of explaining with comments. Remove **ALL** comments unless they impact functionality');
  }
}

function addFileSizeIssues(messages: string[]): void {
  const fileSizes = checkFileSizes('src');
  for (const issue of fileSizes) {
    if (issue.severity === 'critical') {
      messages.push(`👧🏻💬 CRITICAL: ${issue.file} has ${issue.lines} lines! Files over 300 lines MUST be broken up immediately. Split into smaller, focused modules.`);
    } else {
      messages.push(`👧🏻💬 ${issue.file} has ${issue.lines} lines. Consider breaking this into smaller, focused modules.`);
    }
  }
}

function addFunctionSizeIssues(messages: string[]): void {
  const functionSizes = checkFunctionSizes('src');
  for (const issue of functionSizes) {
    if (issue.severity === 'critical') {
      messages.push(`👧🏻💬 CRITICAL: Function '${issue.function}' in ${issue.file} has ${issue.lines} lines! Functions over 10 lines MUST be broken down immediately. Long functions may also indicate an opportunity to introduce a new class.`);
    } else {
      messages.push(`👧🏻💬 Function '${issue.function}' in ${issue.file} has ${issue.lines} lines. Consider extracting helper methods.`);
    }
  }
}

function addUnusedMethodIssues(messages: string[]): void {
  const unusedMethods = checkUnusedMethods('src');
  for (const issue of unusedMethods) {
    messages.push(`👧🏻💬 CRITICAL: Unused private method '${issue.method}' in ${issue.file} at line ${issue.line}. Remove dead code to maintain codebase clarity.`);
  }
}

async function addDiffSizeIssues(messages: string[]): Promise<void> {
  const diffResult = await checkGitDiffSize();
  if (diffResult.message) {
    messages.push(diffResult.message);
  }
}

async function addChangeFrequencyIssues(messages: string[]): Promise<void> {
  const changeIssues = await checkChangeFrequency();
  messages.push(...changeIssues);
}

function addIncompleteRefactoringReminder(messages: string[]): void {
  const incompleteRefactorings = getIncompleteRefactorings();
  if (incompleteRefactorings.length > 0) {
    const refactoringList = incompleteRefactorings.join(', ');
    messages.push(`👧🏻💬 Consider if any incomplete refactorings should be marked complete: ${refactoringList}. To mark complete, test on a file outside fixtures and update src/completion-status.json.`);
  }
}

function reportResults(messages: string[]): void {
  if (messages.length === 0) {
    reportSuccess();
  } else {
    reportIssues(messages);
  }
}

function reportSuccess(): void {
  console.log('✅ All quality checks passed');
  process.exit(0);
}

function reportIssues(messages: string[]): void {
  console.log('❌ Quality issues detected:');
  for (const message of messages) {
    console.log(message);
  }
  process.exit(1);
}

async function main() {
  const messages = await collectQualityIssues();
  reportResults(messages);
}

if (require.main === module) {
  main().catch(console.error);
}