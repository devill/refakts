#!/usr/bin/env node

import { Project, SyntaxKind } from "ts-morph";
import * as path from "path";

interface CommentIssue {
  file: string;
  line: number;
  text: string;
  type: 'single' | 'multi';
}

export function findComments(srcDir: string): CommentIssue[] {
  const project = createProject(srcDir);
  return processAllSourceFiles(project);
}

function processAllSourceFiles(project: any): CommentIssue[] {
  const issues: CommentIssue[] = [];
  
  for (const sourceFile of project.getSourceFiles()) {
    processSourceFile(sourceFile, issues);
  }
  
  return issues;
}

function processSourceFile(sourceFile: any, issues: CommentIssue[]): void {
  const filePath = getRelativeFilePath(sourceFile);
  
  if (shouldSkipFile(filePath)) {
    return;
  }
  
  collectAllComments(sourceFile, filePath, issues);
}

function createProject(srcDir: string) {
  const project = new Project();
  project.addSourceFilesAtPaths(`${srcDir}/**/*.ts`);
  return project;
}

function collectAllComments(sourceFile: any, filePath: string, issues: CommentIssue[]): void {
  collectSingleLineComments(sourceFile, filePath, issues);
  collectMultiLineComments(sourceFile, filePath, issues);
}

function getRelativeFilePath(sourceFile: any): string {
  return path.relative(process.cwd(), sourceFile.getFilePath());
}

function shouldSkipFile(filePath: string): boolean {
  return filePath.includes('.test.') || filePath.includes('.spec.') || filePath.endsWith('.d.ts');
}

function collectSingleLineComments(sourceFile: any, filePath: string, issues: CommentIssue[]): void {
  const singleComments = sourceFile.getDescendantsOfKind(SyntaxKind.SingleLineCommentTrivia);
  for (const comment of singleComments) {
    const text = comment.getText().trim();
    if (isValidSingleLineComment(text)) {
      issues.push(createCommentIssue(filePath, comment, text, 'single'));
    }
  }
}

function collectMultiLineComments(sourceFile: any, filePath: string, issues: CommentIssue[]): void {
  const multiComments = sourceFile.getDescendantsOfKind(SyntaxKind.MultiLineCommentTrivia);
  for (const comment of multiComments) {
    const text = comment.getText().trim();
    if (isValidMultiLineComment(text)) {
      const truncatedText = text.substring(0, 50) + '...';
      issues.push(createCommentIssue(filePath, comment, truncatedText, 'multi'));
    }
  }
}

function isValidSingleLineComment(text: string): boolean {
  return text.startsWith('//') && !text.startsWith('// @') && text.length >= 10;
}

function isValidMultiLineComment(text: string): boolean {
  return !text.startsWith('/**') && text.length >= 15;
}

function createCommentIssue(filePath: string, comment: any, text: string, type: 'single' | 'multi'): CommentIssue {
  return {
    file: filePath,
    line: comment.getStartLineNumber(),
    text: text,
    type: type
  };
}

if (require.main === module) {
  const srcDir = process.argv[2] || 'src';
  const issues = findComments(srcDir);
  
  if (issues.length === 0) {
    console.log('✅ No explanatory comments found');
    process.exit(0);
  }
  
  console.log(`❌ Found ${issues.length} explanatory comments:`);
  for (const issue of issues) {
    console.log(`  ${issue.file}:${issue.line} - ${issue.text}`);
  }
  
  console.log('\n👧🏻💬 **NEVER** use comments to explain code, the code should speak for itself. Extract complex logic into well-named functions instead of explaining with comments. Remove **ALL** comments unless they impact functionality');
  
  process.exit(1);
}