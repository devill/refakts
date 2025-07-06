import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { CommandExecutor } from '../utils/command-executor';

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

describe('Refactoring Integration Tests', () => {
  const fixturesDir = path.join(__dirname, '..', 'fixtures', 'refactoring');
  const commandExecutor = new CommandExecutor();
  
  const getTestCases = (): TestCase[] => {
    const testCases: TestCase[] = [];
    
    if (!fs.existsSync(fixturesDir)) {
      return testCases;
    }
    
    const actionDirs = fs.readdirSync(fixturesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    for (const actionDir of actionDirs) {
      const actionPath = path.join(fixturesDir, actionDir);
      const files = fs.readdirSync(actionPath);
      
      // Handle multi-file test cases (those with subdirectories)
      const subDirs = files.filter(file => 
        fs.statSync(path.join(actionPath, file)).isDirectory()
      );
      
      if (subDirs.length > 0) {
        for (const subDir of subDirs) {
          const subDirPath = path.join(actionPath, subDir);
          const metaFile = path.join(subDirPath, 'meta.yaml');
          
          if (fs.existsSync(metaFile)) {
            const meta = yaml.load(fs.readFileSync(metaFile, 'utf8')) as TestMeta;
            testCases.push({
              name: `${actionDir}/${subDir}`,
              description: meta.description,
              commands: meta.commands,
              inputFile: subDirPath,
              expectedFile: subDirPath,
              receivedFile: subDirPath
            });
          }
        }
      } else {
        // Handle single-file test cases
        const inputFiles = files.filter(file => file.endsWith('.input.ts'));
        
        for (const inputFile of inputFiles) {
          const baseName = inputFile.replace('.input.ts', '');
          const expectedFile = `${baseName}.expected.ts`;
          const receivedFile = `${baseName}.received.ts`;
          
          if (files.includes(expectedFile)) {
            const inputPath = path.join(actionPath, inputFile);
            const content = fs.readFileSync(inputPath, 'utf8');
            const meta = extractMetaFromFile(content);
            
            testCases.push({
              name: `${actionDir}/${baseName}`,
              description: meta.description,
              commands: meta.commands,
              inputFile: inputPath,
              expectedFile: path.join(actionPath, expectedFile),
              receivedFile: path.join(actionPath, receivedFile),
              skip: meta.skip
            });
          }
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
    it('should have test fixtures (none found)', () => {
      console.warn('No test fixtures found in', fixturesDir);
    });
  }

  testCases.forEach(testCase => {
    const testFn = testCase.skip ? it.skip : it;
    testFn(`${testCase.name}: ${testCase.description}`, async () => {
      // Copy input file(s) to received file(s) for processing
      if (fs.statSync(testCase.inputFile).isDirectory()) {
        // Multi-file test case - copy entire directory structure
        await copyDirectory(testCase.inputFile, testCase.receivedFile);
      } else {
        // Single file test case
        fs.copyFileSync(testCase.inputFile, testCase.receivedFile);
      }
      
      // Execute refactoring commands
      for (const command of testCase.commands) {
        // Update file paths in commands to use received files
        let updatedCommand = command.replace('refakts', '').trim();
        
        if (fs.statSync(testCase.inputFile).isFile()) {
          const inputFileName = path.basename(testCase.inputFile);
          updatedCommand = updatedCommand.replace(inputFileName, testCase.receivedFile);
        }
        
        try {
          await commandExecutor.executeCommand(updatedCommand);
        } catch (error) {
          throw new Error(`Command failed: ${updatedCommand}\n${error}`);
        }
      }
      
      // Compare received vs expected
      if (fs.statSync(testCase.expectedFile).isDirectory()) {
        // Compare directory contents
        await compareDirectories(testCase.expectedFile, testCase.receivedFile);
      } else {
        // Compare single files
        const expected = fs.readFileSync(testCase.expectedFile, 'utf8');
        const received = fs.readFileSync(testCase.receivedFile, 'utf8');
        expect(received).toBe(expected);
      }
      
      // Clean up received files on success
      if (fs.statSync(testCase.receivedFile).isDirectory()) {
        fs.rmSync(testCase.receivedFile, { recursive: true, force: true });
      } else {
        fs.unlinkSync(testCase.receivedFile);
      }
    });
  });
});

async function copyDirectory(src: string, dest: string): Promise<void> {
  ensureDestinationExists(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    await copyEntry(src, dest, entry);
  }
}

function ensureDestinationExists(dest: string): void {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
}

async function copyEntry(src: string, dest: string, entry: fs.Dirent): Promise<void> {
  const srcPath = path.join(src, entry.name);
  const destPath = path.join(dest, entry.name);
  
  if (entry.isDirectory()) {
    await copyDirectory(srcPath, destPath);
  } else {
    fs.copyFileSync(srcPath, destPath);
  }
}

async function compareDirectories(expectedDir: string, receivedDir: string): Promise<void> {
  const expectedFiles = getAllFiles(expectedDir);
  const receivedFiles = getAllFiles(receivedDir);
  
  validateDirectoryStructure(expectedFiles, receivedFiles);
  compareFileContents(expectedDir, receivedDir, expectedFiles);
}

function validateDirectoryStructure(expectedFiles: string[], receivedFiles: string[]): void {
  expect(receivedFiles.sort()).toEqual(expectedFiles.sort());
}

function compareFileContents(expectedDir: string, receivedDir: string, files: string[]): void {
  for (const file of files) {
    const expectedPath = path.join(expectedDir, file);
    const receivedPath = path.join(receivedDir, file);
    
    if (fs.statSync(expectedPath).isFile()) {
      compareFileContent(expectedPath, receivedPath);
    }
  }
}

function compareFileContent(expectedPath: string, receivedPath: string): void {
  const expected = fs.readFileSync(expectedPath, 'utf8');
  const received = fs.readFileSync(receivedPath, 'utf8');
  expect(received).toBe(expected);
}

function getAllFiles(dir: string, prefix = ''): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    collectFileEntry(dir, prefix, entry, files);
  }
  
  return files;
}

function collectFileEntry(dir: string, prefix: string, entry: fs.Dirent, files: string[]): void {
  const relativePath = prefix ? path.join(prefix, entry.name) : entry.name;
  
  if (entry.isDirectory()) {
    files.push(...getAllFiles(path.join(dir, entry.name), relativePath));
  } else {
    files.push(relativePath);
  }
}