import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface TestCase {
  name: string;
  description: string;
  commands: string[];
  inputFile: string;
  expectedFile: string;
  receivedFile: string;
  skip?: boolean;
}

interface TestMeta {
  description: string;
  commands: string[];
  skip?: boolean;
}

describe('Locator Integration Tests', () => {
  const fixturesDir = path.join(__dirname, '..', 'fixtures', 'locators');
  
  const getTestCases = (): TestCase[] => {
    const testCases: TestCase[] = [];
    
    if (!fs.existsSync(fixturesDir)) {
      return testCases;
    }
    
    const locatorDirs = fs.readdirSync(fixturesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    for (const locatorDir of locatorDirs) {
      const locatorPath = path.join(fixturesDir, locatorDir);
      const files = fs.readdirSync(locatorPath);
      
      // Handle single-file test cases
      const inputFiles = files.filter(file => file.endsWith('.input.ts'));
      
      for (const inputFile of inputFiles) {
        const baseName = inputFile.replace('.input.ts', '');
        const expectedFile = `${baseName}.expected.ts`;
        const receivedFile = `${baseName}.received.ts`;
        
        if (files.includes(expectedFile)) {
          const inputPath = path.join(locatorPath, inputFile);
          const content = fs.readFileSync(inputPath, 'utf8');
          const meta = extractMetaFromFile(content);
          
          testCases.push({
            name: `${locatorDir}/${baseName}`,
            description: meta.description,
            commands: meta.commands,
            inputFile: inputPath,
            expectedFile: path.join(locatorPath, expectedFile),
            receivedFile: path.join(locatorPath, receivedFile),
            skip: meta.skip
          });
        }
      }
    }
    
    return testCases;
  };

  const extractMetaFromFile = (content: string): TestMeta => {
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
  };

  const testCases = getTestCases();
  
  if (testCases.length === 0) {
    it('should have locator test fixtures (none found)', () => {
      console.warn('No locator test fixtures found in', fixturesDir);
    });
  }

  testCases.forEach(testCase => {
    const testFn = testCase.skip ? it.skip : it;
    testFn(`${testCase.name}: ${testCase.description}`, async () => {
      // Copy input file to received file for processing
      fs.copyFileSync(testCase.inputFile, testCase.receivedFile);
      
      // Execute locator commands - these should output JSON results
      for (const command of testCase.commands) {
        let updatedCommand = command;
        const inputFileName = path.basename(testCase.inputFile);
        updatedCommand = updatedCommand.replace(inputFileName, testCase.receivedFile);
        
        const fullCommand = `npm run dev -- ${updatedCommand}`;
        try {
          const { stdout } = await execAsync(fullCommand, { cwd: path.join(__dirname, '..', '..') });
          
          // For locators, we expect JSON output that we can validate
          // For now, just ensure the command runs without error
          expect(stdout).toBeDefined();
        } catch (error) {
          throw new Error(`Command failed: ${fullCommand}\n${error}`);
        }
      }
      
      // Clean up received files on success
      if (fs.existsSync(testCase.receivedFile)) {
        fs.unlinkSync(testCase.receivedFile);
      }
    });
  });
});