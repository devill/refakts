import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

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
  const meta = initializeMetaData();
  
  for (const line of lines) {
    parseLine(line.trim(), meta);
  }
  
  return meta;
}

function initializeMetaData(): TestMeta {
  return { description: '', commands: [], skip: false };
}

function parseLine(trimmed: string, meta: TestMeta): void {
  if (trimmed.startsWith('* @description')) {
    meta.description = trimmed.replace('* @description', '').trim();
  } else if (trimmed.startsWith('* @command')) {
    meta.commands.push(trimmed.replace('* @command', '').trim());
  } else if (trimmed.startsWith('* @skip')) {
    meta.skip = true;
  }
}

export function getTestCases(fixturesDir: string, expectedExtension: string): TestCase[] {
  if (!fs.existsSync(fixturesDir)) {
    return [];
  }
  
  return loadTestCasesFromDirectories(fixturesDir, expectedExtension);
}

function loadTestCasesFromDirectories(fixturesDir: string, expectedExtension: string): TestCase[] {
  const testCases: TestCase[] = [];
  const testDirs = getDirectoryNames(fixturesDir);
  
  for (const testDir of testDirs) {
    testCases.push(...processTestDirectory(testDir, fixturesDir, expectedExtension));
  }
  
  return testCases;
}

function processTestDirectory(testDir: string, fixturesDir: string, expectedExtension: string): TestCase[] {
  const testPath = path.join(fixturesDir, testDir);
  const files = fs.readdirSync(testPath);
  
  return [
    ...getMultiFileTestCases(testDir, testPath, files),
    ...getSingleFileTestCases(testDir, testPath, files, expectedExtension)
  ];
}

function getDirectoryNames(fixturesDir: string): string[] {
  return fs.readdirSync(fixturesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
}

function getMultiFileTestCases(testDir: string, testPath: string, files: string[]): TestCase[] {
  const subDirs = getSubDirectories(testPath, files);
  return subDirs
    .map(subDir => createMultiFileTestCase(testDir, testPath, subDir))
    .filter(testCase => testCase !== null) as TestCase[];
}

function getSubDirectories(testPath: string, files: string[]): string[] {
  return files.filter(file => 
    fs.statSync(path.join(testPath, file)).isDirectory()
  );
}

function createMultiFileTestCase(testDir: string, testPath: string, subDir: string): TestCase | null {
  const subDirPath = path.join(testPath, subDir);
  const metaFile = path.join(subDirPath, 'meta.yaml');
  
  if (!fs.existsSync(metaFile)) {
    return null;
  }
  
  const meta = yaml.load(fs.readFileSync(metaFile, 'utf8')) as TestMeta;
  return {
    name: `${testDir}/${subDir}`,
    description: meta.description,
    commands: meta.commands,
    inputFile: subDirPath,
    expectedFile: subDirPath,
    receivedFile: subDirPath
  };
}

function getSingleFileTestCases(testDir: string, testPath: string, files: string[], expectedExtension: string): TestCase[] {
  const testCases: TestCase[] = [];
  const inputFiles = getInputFiles(files);
  
  for (const inputFile of inputFiles) {
    const testCase = createSingleFileTestCase(testDir, testPath, inputFile, files, expectedExtension);
    if (testCase) {
      testCases.push(testCase);
    }
  }
  
  return testCases;
}

function getInputFiles(files: string[]): string[] {
  return files.filter(file => file.endsWith('.input.ts'));
}

function createSingleFileTestCase(testDir: string, testPath: string, inputFile: string, files: string[], expectedExtension: string): TestCase | null {
  const baseName = inputFile.replace('.input.ts', '');
  const expectedFile = `${baseName}.expected.${expectedExtension}`;
  
  if (!files.includes(expectedFile)) {
    return null;
  }
  
  return buildTestCase(testDir, testPath, inputFile, baseName, expectedFile, expectedExtension);
}

function buildTestCase(testDir: string, testPath: string, inputFile: string, baseName: string, expectedFile: string, expectedExtension: string): TestCase {
  const inputPath = path.join(testPath, inputFile);
  const content = fs.readFileSync(inputPath, 'utf8');
  const meta = extractMetaFromFile(content);
  
  return {
    name: `${testDir}/${baseName}`,
    description: meta.description,
    commands: meta.commands,
    inputFile: inputPath,
    expectedFile: path.join(testPath, expectedFile),
    receivedFile: path.join(testPath, `${baseName}.received.${expectedExtension}`),
    skip: meta.skip
  };
}