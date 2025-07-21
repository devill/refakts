/* eslint-disable no-unused-vars */
import * as fs from 'fs';
import * as path from 'path';

export interface FixtureConfig {
  id: string;
  description: string;
  command: string;
  skip?: boolean | string;
  '@skip'?: boolean | string;
}

export class FixtureTestCase implements TestCase {
  constructor(
    private config: FixtureConfig,
    private configDir: string
  ) {}

  static create(config: FixtureConfig, configDir: string): FixtureTestCase {
    return new FixtureTestCase(config, configDir);
  }

  get name(): string {
    return `${path.basename(this.configDir)}/${this.config.id}`;
  }

  get description(): string {
    return this.config.description;
  }

  get commands(): string[] {
    return [this.config.command];
  }

  get inputFile(): string {
    return path.join(this.configDir, 'input');
  }

  get expectedFile(): string {
    return path.join(this.configDir, `${this.config.id}.expected.out`);
  }

  get receivedFile(): string {
    return path.join(this.configDir, `${this.config.id}.received.out`);
  }

  get skip(): boolean | string {
    const skipValue = this.config.skip || this.config['@skip'];
    if (typeof skipValue === 'string') {
      return skipValue.trim();
    }
    return !!skipValue;
  }

  get projectDirectory(): string {
    return this.inputFile;
  }

  get expectedDirectory(): string {
    return path.join(this.configDir, `${this.config.id}.expected`);
  }

  get testCaseId(): string {
    return this.config.id;
  }

  isMultiFile(): boolean {
    return !!this.projectDirectory;
  }

  writeReceivedFiles(outputs: any): { outFile: string; errFile: string } {
    const receivedFiles = this.createExpectedFilePaths();
    
    fs.writeFileSync(receivedFiles.outFile, outputs.stdout || '');
    fs.writeFileSync(receivedFiles.errFile, outputs.stderr || '');
    
    return receivedFiles;
  }

  createExpectedFilePaths(): { outFile: string; errFile: string } {
    return {
      outFile: path.join(path.dirname(this.inputFile), `${this.testCaseId}.received.out`),
      errFile: path.join(path.dirname(this.inputFile), `${this.testCaseId}.received.err`)
    };
  }
}
export interface TestCase {
  name: string;
  description: string;
  commands: string[];
  inputFile: string;
  expectedFile: string;
  receivedFile: string;
  skip?: boolean | string;
}

export interface TestMeta {
  description: string;
  commands: string[];
  skip?: boolean | string;
}