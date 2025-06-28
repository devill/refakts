import * as fs from 'fs';
import * as path from 'path';

interface CompletionStatus {
  [key: string]: {
    complete: boolean;
    description: string;
  };
}

export function getFixtureFolders(): string[] {
  const fixturesPath = path.join(__dirname, '..', 'tests', 'fixtures');
  if (!fs.existsSync(fixturesPath)) {
    return [];
  }
  
  return fs.readdirSync(fixturesPath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
}

export function getCompletionStatus(): CompletionStatus {
  const statusPath = getStatusPath();
  if (!fs.existsSync(statusPath)) {
    return {};
  }
  
  return readStatusFile(statusPath);
}

function getStatusPath(): string {
  return path.join(__dirname, 'completion-status.json');
}

function readStatusFile(statusPath: string): CompletionStatus {
  try {
    const content = fs.readFileSync(statusPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return {};
  }
}

export function generateHelpText(): string {
  const fixtureFolders = getFixtureFolders();
  const completionStatus = getCompletionStatus();
  
  const commandLines = buildCommandLines(fixtureFolders, completionStatus);
  return formatHelpText(commandLines);
}

function buildCommandLines(folders: string[], status: CompletionStatus): string[] {
  return folders.map(folder => {
    const folderStatus = status[folder];
    const description = folderStatus?.description || 'No description available';
    const warningText = folderStatus?.complete === false ? ' (incomplete)' : '';
    return `  ${folder}${warningText} - ${description}`;
  });
}

function formatHelpText(commandLines: string[]): string {
  return commandLines.length > 0 ? commandLines.join('\n') : 'No refactoring commands available';
}

export function getIncompleteRefactorings(): string[] {
  const fixtureFolders = getFixtureFolders();
  const completionStatus = getCompletionStatus();
  
  return fixtureFolders.filter(folder => {
    const status = completionStatus[folder];
    return status?.complete === false;
  });
}