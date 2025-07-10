import * as path from 'path';

export class FixtureLocation {
  constructor(
    private testDir: string,
    private testPath: string,
    private baseName: string
  ) {}

  getTestName(): string {
    return `${this.testDir}/${this.baseName}`;
  }

  getInputFile(): string {
    return path.join(this.testPath, `${this.baseName}.input.ts`);
  }

  getExpectedFile(extension: string = 'ts'): string {
    return path.join(this.testPath, `${this.baseName}.expected.${extension}`);
  }

  getReceivedFile(extension: string = 'ts'): string {
    return path.join(this.testPath, `${this.baseName}.received.${extension}`);
  }

  getAllExpectedFiles(): { ts?: string; out?: string; err?: string; yaml?: string } {
    return {
      ts: this.getExpectedFile('ts'),
      out: this.getExpectedFile('out'),
      err: this.getExpectedFile('err'),
      yaml: this.getExpectedFile('yaml')
    };
  }

  getAllReceivedFiles(): { ts: string; out: string; err: string; yaml: string } {
    return {
      ts: this.getReceivedFile('ts'),
      out: this.getReceivedFile('out'),
      err: this.getReceivedFile('err'),
      yaml: this.getReceivedFile('yaml')
    };
  }

  static fromInputFile(inputFile: string): FixtureLocation {
    const testPath = path.dirname(inputFile);
    const baseName = path.basename(inputFile, '.input.ts');
    const testDir = path.basename(testPath);
    
    return new FixtureLocation(testDir, testPath, baseName);
  }
}