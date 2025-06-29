import * as fs from 'fs';
import * as path from 'path';

interface UnusedMethodIssue {
  file: string;
  method: string;
  line: number;
}

export function checkUnusedMethods(directory: string): UnusedMethodIssue[] {
  const issues: UnusedMethodIssue[] = [];
  const files = findTypeScriptFiles(directory);
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const fileIssues = findUnusedMethodsInFile(file, content);
    issues.push(...fileIssues);
  }
  
  return issues;
}

function findTypeScriptFiles(directory: string): string[] {
  const files: string[] = [];
  
  function walkDirectory(dir: string): void {
    const entries = fs.readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !shouldSkipDirectory(entry)) {
        walkDirectory(fullPath);
      } else if (stat.isFile() && entry.endsWith('.ts')) {
        files.push(fullPath);
      }
    }
  }
  
  walkDirectory(directory);
  return files;
}

function shouldSkipDirectory(dirName: string): boolean {
  return dirName === 'node_modules' || dirName === '.git' || dirName === 'dist';
}

function findUnusedMethodsInFile(filePath: string, content: string): UnusedMethodIssue[] {
  const issues: UnusedMethodIssue[] = [];
  const lines = content.split('\n');
  
  const privateMethods = extractPrivateMethods(lines);
  const usedMethods = findMethodUsages(content);
  
  for (const method of privateMethods) {
    if (!usedMethods.has(method.name)) {
      issues.push({
        file: filePath,
        method: method.name,
        line: method.line
      });
    }
  }
  
  return issues;
}

function extractPrivateMethods(lines: string[]): Array<{name: string; line: number}> {
  const methods: Array<{name: string; line: number}> = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/private\s+(\w+)\s*\(/);
    
    if (match) {
      methods.push({
        name: match[1],
        line: i + 1
      });
    }
  }
  
  return methods;
}

function findMethodUsages(content: string): Set<string> {
  const usages = new Set<string>();
  const methodCallPattern = /this\.(\w+)\(/g;
  
  let match;
  while ((match = methodCallPattern.exec(content)) !== null) {
    usages.add(match[1]);
  }
  
  return usages;
}