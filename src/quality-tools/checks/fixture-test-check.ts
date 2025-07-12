import { QualityCheck, QualityIssue } from '../quality-check-interface';
import * as fs from 'fs';
import * as path from 'path';

export const fixtureTestCheck: QualityCheck = {
  name: 'fixture-test',
  check: (): QualityIssue[] => {
    const fixturesDir = path.join(process.cwd(), 'tests', 'fixtures');
    if (!fs.existsSync(fixturesDir)) {
      return [];
    }
    
    return findFixtureTestsWithoutExpectedFiles(fixturesDir);
  },
  getGroupDefinition: (groupKey: string) => groupKey === 'fixture-test' ? {
    title: 'FIXTURE TESTS WITHOUT EXPECTED FILES',
    description: 'Fixture tests without expected files do not validate output and provide no value.',
    actionGuidance: 'Add at least one expected file (.expected.out, .expected.err, .expected.ts, or .expected/ directory) to each fixture test, or remove the test if it serves no purpose.'
  } : undefined
};

const findFixtureTestsWithoutExpectedFiles = (fixturesDir: string): QualityIssue[] => {
  const issues: QualityIssue[] = [];
  
  walkDirectory(fixturesDir, (dir) => {
    if (isFixtureTestDirectory(dir)) {
      const testIssues = validateFixtureTestDirectory(dir);
      issues.push(...testIssues);
    }
  });
  
  return issues;
};

const walkDirectory = (dir: string, callback: (_dir: string) => void): void => {
  if (!fs.existsSync(dir)) return;
  
  const entries = fs.readdirSync(dir);
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      callback(fullPath);
      walkDirectory(fullPath, callback);
    }
  }
};

const isFixtureTestDirectory = (dir: string): boolean => {
  return hasFixtureConfig(dir) || hasSingleFileTests(dir);
};

const hasFixtureConfig = (dir: string): boolean => {
  return fs.existsSync(path.join(dir, 'fixture.config.json'));
};

const hasSingleFileTests = (dir: string): boolean => {
  const files = fs.readdirSync(dir);
  return files.some(file => file.endsWith('.input.ts'));
};

const validateFixtureTestDirectory = (dir: string): QualityIssue[] => {
  const issues: QualityIssue[] = [];
  
  if (hasFixtureConfig(dir)) {
    const multiFileIssues = validateMultiFileFixtures(dir);
    issues.push(...multiFileIssues);
  }
  
  const singleFileIssues = validateSingleFileFixtures(dir);
  issues.push(...singleFileIssues);
  
  return issues;
};

const validateMultiFileFixtures = (dir: string): QualityIssue[] => {
  const configPath = path.join(dir, 'fixture.config.json');
  
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const tests = Array.isArray(config) ? config : [config];
    
    return tests
      .filter(test => !test.skip)
      .filter(test => !hasExpectedFilesForMultiFileTest(dir, test.id))
      .map(test => createFixtureTestIssue(dir, `Multi-file test '${test.id}' has no expected files`));
      
  } catch {
    return [createFixtureTestIssue(dir, 'Invalid fixture.config.json')];
  }
};

const validateSingleFileFixtures = (dir: string): QualityIssue[] => {
  const files = fs.readdirSync(dir);
  const inputFiles = files.filter(file => file.endsWith('.input.ts'));
  
  return inputFiles
    .filter(inputFile => !hasExpectedFilesForSingleFileTest(dir, inputFile))
    .map(inputFile => createFixtureTestIssue(dir, `Single-file test '${inputFile}' has no expected files`));
};

const hasExpectedFilesForMultiFileTest = (dir: string, testId: string): boolean => {
  const expectedFiles = [
    `${testId}.expected.out`,
    `${testId}.expected.err`,
    `${testId}.expected.ts`
  ];
  
  const hasExpectedFile = expectedFiles.some(file => 
    fs.existsSync(path.join(dir, file))
  );
  
  const hasExpectedDir = fs.existsSync(path.join(dir, `${testId}.expected`));
  
  return hasExpectedFile || hasExpectedDir;
};

const hasExpectedFilesForSingleFileTest = (dir: string, inputFile: string): boolean => {
  const baseName = inputFile.replace('.input.ts', '');
  const expectedFiles = [
    `${baseName}.expected.out`,
    `${baseName}.expected.err`,
    `${baseName}.expected.ts`
  ];
  
  return expectedFiles.some(file => 
    fs.existsSync(path.join(dir, file))
  );
};

const createFixtureTestIssue = (dir: string, message: string): QualityIssue => ({
  type: 'fixture-test',
  severity: 'critical',
  message,
  file: path.relative(process.cwd(), dir)
});