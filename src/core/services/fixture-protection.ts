import * as path from 'path';

export class FixtureProtection {
  static validateFile(filePath: string): void {
    if (this.isFixtureFile(filePath) && !this.isTestContext()) {
      throw new Error(
        `Cannot execute refakts on fixture files outside test context.\n` +
        `File: ${filePath}\n` +
        `Fixture files are test data and should not be modified directly.`
      );
    }
  }

  private static isFixtureFile(filePath: string): boolean {
    const normalizedPath = path.resolve(filePath);
    return normalizedPath.includes(path.join('tests', 'fixtures'));
  }

  private static isTestContext(): boolean {
    return this.isJestEnvironment() || 
           this.isTestProcess() || 
           this.isTestCommand();
  }

  private static isJestEnvironment(): boolean {
    return process.env.NODE_ENV === 'test' || 
           'JEST_WORKER_ID' in process.env ||
           'JEST_TEST_TIMEOUT' in process.env;
  }

  private static isTestProcess(): boolean {
    const argv = process.argv.join(' ');
    return argv.includes('jest') || 
           argv.includes('fixture-runner') ||
           argv.includes('test:') ||
           argv.includes('npm test');
  }

  private static isTestCommand(): boolean {
    const title = process.title || '';
    return title.includes('jest') || title.includes('test');
  }
}