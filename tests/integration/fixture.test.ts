import * as path from 'path';
import { CommandExecutor } from '../utils/command-executor';
import { getTestCases } from '../utils/test-case-loader';
import { FixtureValidator } from '../utils/fixture-validator';

describe('Fixture Integration Tests', () => {
  const fixturesDir = path.join(__dirname, '..', 'fixtures');
  const commandExecutor = new CommandExecutor();
  const validator = new FixtureValidator(commandExecutor);

  const testCases = getTestCases(fixturesDir, 'input');

  if (testCases.length === 0) {
    it('should have fixture test cases (none found)', () => {
      console.warn('No fixture test cases found in', fixturesDir);
    });
  }

  testCases.forEach(testCase => {
    const testFn = testCase.skip ? it.skip : it;
    testFn(`${testCase.name}: ${testCase.description}`, async () => {
      await validator.validate(testCase);
    });
  });
});