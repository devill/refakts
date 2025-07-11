/* eslint-disable no-unused-vars */
export class FixtureTestCase {
  constructor(
    public name: string,
    public description: string,
    public commands: string[],
    public inputFile: string,
    public expectedFile: string,
    public receivedFile: string,
    public skip?: boolean,
    public projectDirectory?: string,
    public expectedDirectory?: string,
    public testCaseId?: string
  ) {}

  isMultiFile(): boolean {
    return !!this.projectDirectory;
  }

  isSingleFile(): boolean {
    return !this.isMultiFile();
  }

  getWorkingDirectory(): string {
    return this.projectDirectory || process.cwd();
  }
}
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