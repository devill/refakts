import * as path from 'path';
import { CommandExecutor } from '../utils/command-executor';
import { getTestCases } from '../utils/test-case-loader';
import { TestCaseValidator } from '../utils/test-case-validator';

describe('Select Integration Tests', () => {
  const fixturesDir = path.join(__dirname, '..', 'fixtures', 'select');
  const commandExecutor = new CommandExecutor();
  const validator = new TestCaseValidator(commandExecutor);
  const testCases = getTestCases(fixturesDir, 'txt');
  
  if (testCases.length === 0) {
    it('should have select test fixtures (none found)', () => {
      console.warn('No select test fixtures found in', fixturesDir);
    });
  }

  testCases.forEach(testCase => {
    const testFn = testCase.skip ? it.skip : it;
    testFn(`${testCase.name}: ${testCase.description}`, async () => {
      await validator.validateTextOutput(testCase);
    });
  });
});