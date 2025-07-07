/**
 * Configuration class for test case creation parameters.
 * Encapsulates the essential properties needed for test case factory operations.
 */
export class TestCaseConfiguration {
  readonly testDir: string;
  readonly testPath: string;
  readonly baseName: string;
  readonly expectedExtension: string;

  constructor(testDir: string, testPath: string, baseName: string, expectedExtension: string) {
    this.testDir = testDir;
    this.testPath = testPath;
    this.baseName = baseName;
    this.expectedExtension = expectedExtension;
  }
}