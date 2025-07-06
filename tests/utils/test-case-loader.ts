import * as fs from 'fs';
import * as path from 'path';

export interface TestCase {
  name: string;
  description: string;
  commands: string[];
  inputFile: string;
  expectedFile: string;
  receivedFile: string;
  skip?: boolean;
}

export interface TestMeta {
  description: string;
  commands: string[];
  skip?: boolean;
}

export function extractMetaFromFile(content: string): TestMeta {
  const lines = content.split('\n');
  let description = '';
  const commands: string[] = [];
  let skip = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('* @description')) {
      description = trimmed.replace('* @description', '').trim();
    } else if (trimmed.startsWith('* @command')) {
      commands.push(trimmed.replace('* @command', '').trim());
    } else if (trimmed.startsWith('* @skip')) {
      skip = true;
    }
  }
  
  return { description, commands, skip };
}

export function getTestCases(fixturesDir: string, expectedExtension: string): TestCase[] {
  const testCases: TestCase[] = [];
  
  if (!fs.existsSync(fixturesDir)) {
    return testCases;
  }
  
  const testDirs = fs.readdirSync(fixturesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  for (const testDir of testDirs) {
    const testPath = path.join(fixturesDir, testDir);
    const files = fs.readdirSync(testPath);
    
    const inputFiles = files.filter(file => file.endsWith('.input.ts'));
    
    for (const inputFile of inputFiles) {
      const baseName = inputFile.replace('.input.ts', '');
      const expectedFile = `${baseName}.expected.${expectedExtension}`;
      const receivedFile = `${baseName}.received.${expectedExtension}`;
      
      if (files.includes(expectedFile)) {
        const inputPath = path.join(testPath, inputFile);
        const content = fs.readFileSync(inputPath, 'utf8');
        const meta = extractMetaFromFile(content);
        
        testCases.push({
          name: `${testDir}/${baseName}`,
          description: meta.description,
          commands: meta.commands,
          inputFile: inputPath,
          expectedFile: path.join(testPath, expectedFile),
          receivedFile: path.join(testPath, receivedFile),
          skip: meta.skip
        });
      }
    }
  }
  
  return testCases;
}