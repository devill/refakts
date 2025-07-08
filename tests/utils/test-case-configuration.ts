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