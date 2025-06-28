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
  const project = new Project();
  project.addSourceFilesAtPaths(`${srcDir}/**/*.ts`);
  
  const issues: CommentIssue[] = [];
  
  for (const sourceFile of project.getSourceFiles()) {
    const filePath = path.relative(process.cwd(), sourceFile.getFilePath());
    
    // Skip test files and definition files
    if (filePath.includes('.test.') || filePath.includes('.spec.') || filePath.endsWith('.d.ts')) {
      continue;
    }
    
    // Get single line comments
    const singleComments = sourceFile.getDescendantsOfKind(SyntaxKind.SingleLineCommentTrivia);
    for (const comment of singleComments) {
      const text = comment.getText().trim();
      // Skip JSDoc-style comments and simple markers
      if (!text.startsWith('//') || text.startsWith('// @') || text.length < 10) {
        continue;
      }
      
      issues.push({
        file: filePath,
        line: comment.getStartLineNumber(),
        text: text,
        type: 'single'
      });
    }
    
    // Get multi-line comments (excluding JSDoc)
    const multiComments = sourceFile.getDescendantsOfKind(SyntaxKind.MultiLineCommentTrivia);
    for (const comment of multiComments) {
      const text = comment.getText().trim();
      // Skip JSDoc comments
      if (text.startsWith('/**') || text.length < 15) {
        continue;
      }
      
      issues.push({
        file: filePath,
        line: comment.getStartLineNumber(),
        text: text.substring(0, 50) + '...',
        type: 'multi'
      });
    }
  }
  
  return issues;
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