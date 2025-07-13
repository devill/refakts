import { TestCase } from './test-case-loader';

export interface TestValidator {
  validate(_testCase: TestCase): Promise<void>;
}