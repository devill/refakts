import * as path from 'path';
import { CommandExecutor } from '../utils/command-executor';
import { getTestCases } from '../utils/test-case-loader';
import { TestCaseValidator } from '../utils/test-case-validator';

describe('Refactoring Integration Tests', () => {
  const fixturesDir = path.join(__dirname, '..', 'fixtures', 'refactoring');
  const commandExecutor = new CommandExecutor();
  const validator = new TestCaseValidator(commandExecutor);
  const testCases = getTestCases(fixturesDir, 'ts');
  
  if (testCases.length === 0) {
    it('should have test fixtures (none found)', () => {
      console.warn('No test fixtures found in', fixturesDir);
    });
  }

  testCases.forEach(testCase => {
    const testFn = testCase.skip ? it.skip : it;
    testFn(`${testCase.name}: ${testCase.description}`, async () => {
      await validator.validateRefactoringOutput(testCase);
    });
  });
});

