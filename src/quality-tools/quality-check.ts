#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import { findComments } from './comment-detector';

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
    if (error.stdout && error.stdout.includes('duplications found')) {
      return { 
        hasIssues: true, 
        message: '👧🏻💬 Code duplication detected. Look for missing abstractions - similar code patterns indicate shared concepts that should be extracted into reusable functions or classes.' 
      };
    }
    return { hasIssues: false };
  }
}

async function runComplexityCheck(): Promise<{ hasIssues: boolean; message?: string }> {
  try {
    const { stdout } = await execAsync('npx complexity-report --format json src');
    const report = JSON.parse(stdout);
    
    let hasComplexFunctions = false;
    let hasManyParams = false;
    
    for (const file of report.reports || []) {
      for (const func of file.functions || []) {
        if (func.complexity && func.complexity.cyclomatic > 5) {
          hasComplexFunctions = true;
        }
        if (func.params && func.params > 2) {
          hasManyParams = true;
        }
      }
    }
    
    const messages: string[] = [];
    if (hasComplexFunctions) {
      messages.push('👧🏻💬 High cyclomatic complexity detected. Break down complex functions into smaller, single-purpose methods.');
    }
    if (hasManyParams) {
      messages.push('👧🏻💬 Functions with more than 2 parameters detected. Consider using parameter objects to group related parameters.');
    }
    
    return { 
      hasIssues: hasComplexFunctions || hasManyParams,
      message: messages.join('\n')
    };
  } catch (error) {
    return { hasIssues: false };
  }
}

async function main() {
  const report: QualityReport = {
    duplication: false,
    complexity: false,
    comments: false,
    messages: []
  };
  
  // Check duplication
  const dupResult = await runDuplicationCheck();
  if (dupResult.hasIssues && dupResult.message) {
    report.duplication = true;
    report.messages.push(dupResult.message);
  }
  
  // Check complexity
  const complexityResult = await runComplexityCheck();
  if (complexityResult.hasIssues && complexityResult.message) {
    report.complexity = true;
    report.messages.push(complexityResult.message);
  }
  
  // Check comments
  const comments = findComments('src');
  if (comments.length > 0) {
    report.comments = true;
    report.messages.push('👧🏻💬 **NEVER** use comments to explain code, the code should speak for itself. Extract complex logic into well-named functions instead of explaining with comments. Remove **ALL** comments unless they impact functionality');
  }
  
  if (report.messages.length === 0) {
    console.log('✅ All quality checks passed');
    process.exit(0);
  }
  
  console.log('❌ Quality issues detected:');
  for (const message of report.messages) {
    console.log(message);
  }
  
  process.exit(1);
}

if (require.main === module) {
  main().catch(console.error);
}