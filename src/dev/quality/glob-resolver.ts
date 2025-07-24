import { glob } from 'glob';
import * as fs from 'fs';

export const resolveGlobPatterns = async (patterns: string[]): Promise<string[]> => {
  const allFiles = await Promise.all(
    patterns.map(pattern => glob(pattern))
  );
  const uniqueFiles = [...new Set(allFiles.flat())];
  return uniqueFiles.filter(file => 
    fs.existsSync(file) && file.endsWith('.ts') && !file.endsWith('.fixture.ts')
  );
};