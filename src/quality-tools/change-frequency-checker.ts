import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface FileChangeData {
  fileName: string;
  changeCount: number;
}

interface CommitFileData {
  commit: string;
  files: string[];
}

export async function checkChangeFrequency(): Promise<string[]> {
  return await analyzeChangePatterns();
}

async function analyzeChangePatterns(): Promise<string[]> {
  try {
    return await collectAllChangeIssues();
  } catch (error) {
    warnAboutAnalysisFailure();
    return [];
  }
}

async function collectAllChangeIssues(): Promise<string[]> {
  const frequentFiles = await findFrequentlyChangedFiles();
  const cohesiveChanges = await findCohesiveChanges();
  
  return [...frequentFiles, ...cohesiveChanges];
}

function warnAboutAnalysisFailure(): void {
  console.warn('Warning: Could not analyze git history for change frequency');
}

async function findFrequentlyChangedFiles(): Promise<string[]> {
  try {
    const changeData = await getFileChangeData();
    return analyzeFileChangeFrequency(changeData);
  } catch (error) {
    return [];
  }
}

async function getFileChangeData(): Promise<string[]> {
  const { stdout } = await execAsync('git log --since="30 days ago" --name-only --pretty=format: | sort | uniq -c | sort -nr');
  return stdout.trim().split('\n').filter(line => line.trim());
}

function analyzeFileChangeFrequency(lines: string[]): string[] {
  const issues: string[] = [];
  
  for (const line of lines) {
    const changeInfo = parseChangeCountLine(line);
    if (changeInfo && shouldReportFile(changeInfo)) {
      issues.push(createFrequencyWarning(changeInfo));
    }
  }
  
  return issues;
}

function parseChangeCountLine(line: string): { count: number; fileName: string } | null {
  const match = line.trim().match(/^(\d+)\s+(.+)$/);
  if (match) {
    return {
      count: parseInt(match[1]),
      fileName: match[2]
    };
  }
  return null;
}

function shouldReportFile(changeInfo: { count: number; fileName: string }): boolean {
  return changeInfo.fileName.startsWith('src/') && 
         changeInfo.fileName.endsWith('.ts') && 
         changeInfo.count >= 5;
}

function createFrequencyWarning(changeInfo: { count: number; fileName: string }): string {
  return `👧🏻💬 File '${changeInfo.fileName}' has changed ${changeInfo.count} times in the last 30 days. Consider if this violates the open-closed principle - the design should be extensible without frequent modifications.`;
}

async function findCohesiveChanges(): Promise<string[]> {
  try {
    const commitData = await getCommitData();
    return analyzeCohesiveChanges(commitData);
  } catch (error) {
    return [];
  }
}

async function getCommitData(): Promise<CommitFileData[]> {
  const { stdout } = await execAsync('git log --since="30 days ago" --name-only --pretty=format:"%H" | awk "NF"');
  const lines = stdout.trim().split('\n');
  return parseCommitData(lines);
}

function parseCommitData(lines: string[]): CommitFileData[] {
  const parser = createCommitParser();
  return processLines(lines, parser);
}

function createCommitParser() {
  return {
    commitData: [] as CommitFileData[],
    currentCommit: '',
    currentFiles: [] as string[]
  };
}

function processLines(lines: string[], parser: any): CommitFileData[] {
  for (const line of lines) {
    processLine(line, parser);
  }
  parser.commitData.push(...saveCurrentCommit(parser.currentCommit, parser.currentFiles));
  return parser.commitData;
}

function processLine(line: string, parser: any): void {
  if (isCommitHash(line)) {
    parser.commitData.push(...saveCurrentCommit(parser.currentCommit, parser.currentFiles));
    parser.currentCommit = line;
    parser.currentFiles = [];
  } else if (isRelevantFile(line)) {
    parser.currentFiles.push(line);
  }
}

function isCommitHash(line: string): boolean {
  return line.match(/^[a-f0-9]{40}$/) !== null;
}

function isRelevantFile(line: string): boolean {
  return line.startsWith('src/') && line.endsWith('.ts');
}

function saveCurrentCommit(commit: string, files: string[]): CommitFileData[] {
  if (commit && files.length > 0) {
    return [{ commit, files }];
  }
  return [];
}

function analyzeCohesiveChanges(commitData: CommitFileData[]): string[] {
  const filePairs = findFrequentFilePairs(commitData);
  const issues: string[] = [];
  
  for (const [files, count] of filePairs) {
    if (count >= 3) {
      issues.push(createCohesionWarning(files, count));
    }
  }
  
  return issues;
}

function createCohesionWarning(files: string[], count: number): string {
  return `👧🏻💬 Files [${files.join(', ')}] frequently change together (${count} times). This suggests abstraction leakage - consider if these concerns should be better encapsulated.`;
}

function findFrequentFilePairs(commitData: CommitFileData[]): Map<string[], number> {
  const pairCounts = countFilePairs(commitData);
  return convertPairCountsToMap(pairCounts);
}

function countFilePairs(commitData: CommitFileData[]): Map<string, number> {
  const pairCounts = new Map<string, number>();
  
  for (const commit of commitData) {
    if (commit.files.length >= 2) {
      const pairs = generateFilePairs(commit.files);
      recordPairs(pairs, pairCounts);
    }
  }
  
  return pairCounts;
}

function generateFilePairs(files: string[]): string[] {
  const sortedFiles = files.sort();
  const pairs: string[] = [];
  
  for (let i = 0; i < sortedFiles.length; i++) {
    for (let j = i + 1; j < sortedFiles.length; j++) {
      pairs.push(`${sortedFiles[i]}|${sortedFiles[j]}`);
    }
  }
  
  return pairs;
}

function recordPairs(pairs: string[], pairCounts: Map<string, number>): void {
  for (const pairKey of pairs) {
    pairCounts.set(pairKey, (pairCounts.get(pairKey) || 0) + 1);
  }
}

function convertPairCountsToMap(pairCounts: Map<string, number>): Map<string[], number> {
  const result = new Map<string[], number>();
  for (const [pairKey, count] of pairCounts) {
    const files = pairKey.split('|');
    result.set(files, count);
  }
  return result;
}