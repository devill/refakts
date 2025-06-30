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
  walkDirectory(directory, files);
  return files;
}

function walkDirectory(dir: string, files: string[]): void {
  const entries = fs.readdirSync(dir);
  
  for (const entry of entries) {
    processDirectoryEntry(dir, entry, files);
  }
}

function processDirectoryEntry(dir: string, entry: string, files: string[]): void {
  const fullPath = path.join(dir, entry);
  const stat = fs.statSync(fullPath);
  
  if (stat.isDirectory() && !shouldSkipDirectory(entry)) {
    walkDirectory(fullPath, files);
  } else if (isTypeScriptFile(stat, entry)) {
    files.push(fullPath);
  }
}

function isTypeScriptFile(stat: fs.Stats, entry: string): boolean {
  return stat.isFile() && entry.endsWith('.ts');
}

function shouldSkipDirectory(dirName: string): boolean {
  return dirName === 'node_modules' || dirName === '.git' || dirName === 'dist';
}

function findUnusedMethodsInFile(filePath: string, content: string): UnusedMethodIssue[] {
  const lines = content.split('\n');
  const privateMethods = extractPrivateMethods(lines);
  const usedMethods = findMethodUsages(content);
  
  return findUnusedFromPrivateMethods(filePath, privateMethods, usedMethods);
}

function findUnusedFromPrivateMethods(
  filePath: string,
  privateMethods: Array<{name: string; line: number}>,
  usedMethods: Set<string>
): UnusedMethodIssue[] {
  return privateMethods
    .filter(method => !usedMethods.has(method.name))
    .map(method => createUnusedMethodIssue(filePath, method));
}

function createUnusedMethodIssue(
  filePath: string,
  method: {name: string; line: number}
): UnusedMethodIssue {
  return {
    file: filePath,
    method: method.name,
    line: method.line
  };
}

function extractPrivateMethods(lines: string[]): Array<{name: string; line: number}> {
  const methods: Array<{name: string; line: number}> = [];
  
  for (let i = 0; i < lines.length; i++) {
    const method = tryExtractPrivateMethod(lines[i], i + 1);
    if (method) {
      methods.push(method);
    }
  }
  
  return methods;
}

function tryExtractPrivateMethod(line: string, lineNumber: number): {name: string; line: number} | null {
  const match = line.match(/private\s+(\w+)\s*\(/);
  
  if (match) {
    return createMethodReference(match[1], lineNumber);
  }
  
  return null;
}

function createMethodReference(name: string, line: number): {name: string; line: number} {
  return { name, line };
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