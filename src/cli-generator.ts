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
  const statusPath = path.join(__dirname, 'completion-status.json');
  if (!fs.existsSync(statusPath)) {
    return {};
  }
  
  try {
    const content = fs.readFileSync(statusPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading completion status:', error);
    return {};
  }
}

export function generateHelpText(): string {
  const fixtureFolders = getFixtureFolders();
  const completionStatus = getCompletionStatus();
  
  let helpText = 'Available refactoring commands:\n\n';
  
  for (const folder of fixtureFolders) {
    const status = completionStatus[folder];
    const description = status?.description || 'No description available';
    const warningText = status?.complete === false ? ' (warning: incomplete)' : '';
    
    helpText += `  ${folder}${warningText}\n`;
    helpText += `    ${description}\n\n`;
  }
  
  return helpText.trim();
}

export function getIncompleteRefactorings(): string[] {
  const fixtureFolders = getFixtureFolders();
  const completionStatus = getCompletionStatus();
  
  return fixtureFolders.filter(folder => {
    const status = completionStatus[folder];
    return status?.complete === false;
  });
}