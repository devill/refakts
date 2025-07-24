import { execSync } from 'child_process';

export const getLastCommitId = (filePath: string): string | null => {
  try {
    const result = execSync(`git log -1 --format="%H" -- "${filePath}"`, { 
      encoding: 'utf8',
      cwd: process.cwd()
    }).trim();
    return result || null;
  } catch {
    return null;
  }
};