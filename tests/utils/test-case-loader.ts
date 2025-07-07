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
    .map(subDir => TestCaseBuilder.createMultiFileTestCase(testDir, testPath, subDir))
    .filter(testCase => testCase !== null) as TestCase[];
}

function getSubDirectories(testPath: string, files: string[]): string[] {
  return files.filter(file => 
    fs.statSync(path.join(testPath, file)).isDirectory()
  );
}

class TestCaseBuilder {
  static createMultiFileTestCase(testDir: string, testPath: string, subDir: string): TestCase | null {
    const subDirPath = path.join(testPath, subDir);
    const metaFile = path.join(subDirPath, 'meta.yaml');
    
    if (!this.hasMetaFile(metaFile)) {
      return null;
    }
    
    return this.createTestCaseFromMetaFile(testDir, subDir, subDirPath, metaFile);
  }

  private static createTestCaseFromMetaFile(testDir: string, subDir: string, subDirPath: string, metaFile: string): TestCase {
    const meta = this.loadMetaFromFile(metaFile);
    return this.buildMultiFileTestCase(testDir, subDir, subDirPath, meta);
  }

  private static hasMetaFile(metaFile: string): boolean {
    return fs.existsSync(metaFile);
  }

  private static loadMetaFromFile(metaFile: string): TestMeta {
    return yaml.load(fs.readFileSync(metaFile, 'utf8')) as TestMeta;
  }

  private static buildMultiFileTestCase(testDir: string, subDir: string, subDirPath: string, meta: TestMeta): TestCase {
    return {
      name: `${testDir}/${subDir}`,
      description: meta.description,
      commands: meta.commands,
      inputFile: subDirPath,
      expectedFile: subDirPath,
      receivedFile: subDirPath
    };
  }

  static getSingleFileTestCases(testDir: string, testPath: string, files: string[], expectedExtension: string): TestCase[] {
    const inputFiles = this.getInputFiles(files);
    return this.buildSingleFileTestCases(testDir, testPath, inputFiles, files, expectedExtension);
  }

  private static getInputFiles(files: string[]): string[] {
    return files.filter(file => file.endsWith('.input.ts'));
  }

  private static buildSingleFileTestCases(testDir: string, testPath: string, inputFiles: string[], files: string[], expectedExtension: string): TestCase[] {
    const testCases: TestCase[] = [];
    
    for (const inputFile of inputFiles) {
      this.addTestCaseIfValid(testCases, testDir, testPath, inputFile, files, expectedExtension);
    }
    
    return testCases;
  }

  private static addTestCaseIfValid(testCases: TestCase[], testDir: string, testPath: string, inputFile: string, files: string[], expectedExtension: string): void {
    const testCase = this.createSingleFileTestCase(testDir, testPath, inputFile, files, expectedExtension);
    if (testCase) {
      testCases.push(testCase);
    }
  }

  private static createSingleFileTestCase(testDir: string, testPath: string, inputFile: string, files: string[], expectedExtension: string): TestCase | null {
    const baseName = inputFile.replace('.input.ts', '');
    const expectedFile = `${baseName}.expected.${expectedExtension}`;
    
    if (!files.includes(expectedFile)) {
      return null;
    }
    
    return this.buildTestCase(testDir, testPath, inputFile, baseName, expectedFile, expectedExtension);
  }

  private static buildTestCase(testDir: string, testPath: string, inputFile: string, baseName: string, expectedFile: string, expectedExtension: string): TestCase {
    const inputPath = path.join(testPath, inputFile);
    const meta = this.extractMetaFromInputFile(inputPath);
    const testPaths = this.buildTestPaths(testPath, baseName, expectedFile, expectedExtension);
    
    return this.createTestCaseFromData(testDir, baseName, meta, inputPath, testPaths);
  }

  private static extractMetaFromInputFile(inputPath: string): TestMeta {
    const content = fs.readFileSync(inputPath, 'utf8');
    return extractMetaFromFile(content);
  }

  private static buildTestPaths(testPath: string, baseName: string, expectedFile: string, expectedExtension: string): { expectedFile: string; receivedFile: string } {
    return {
      expectedFile: path.join(testPath, expectedFile),
      receivedFile: path.join(testPath, `${baseName}.received.${expectedExtension}`)
    };
  }

  private static createTestCaseFromData(testDir: string, baseName: string, meta: TestMeta, inputPath: string, testPaths: { expectedFile: string; receivedFile: string }): TestCase {
    const testName = this.buildTestName(testDir, baseName);
    const testCase = this.buildTestCaseStructure(testName, meta, inputPath, testPaths);
    
    return testCase;
  }

  private static buildTestName(testDir: string, baseName: string): string {
    return `${testDir}/${baseName}`;
  }

  private static buildTestCaseStructure(name: string, meta: TestMeta, inputPath: string, testPaths: { expectedFile: string; receivedFile: string }): TestCase {
    return {
      name,
      description: meta.description,
      commands: meta.commands,
      inputFile: inputPath,
      expectedFile: testPaths.expectedFile,
      receivedFile: testPaths.receivedFile,
      skip: meta.skip
    };
  }
}

function getSingleFileTestCases(testDir: string, testPath: string, files: string[], expectedExtension: string): TestCase[] {
  return TestCaseBuilder.getSingleFileTestCases(testDir, testPath, files, expectedExtension);
}
