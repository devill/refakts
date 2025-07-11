import * as path from 'path';
import { TestCase, FixtureTestCase } from './test-case-loader';

export class MultiFileTestCaseFactory {
  createFromConfigFile(configFile: string): TestCase[] {
    const testCaseConfigs = this.readConfigFile(configFile);
    const configDir = path.dirname(configFile);
    
    return this.createTestCases(testCaseConfigs, configDir);
  }

  private createTestCases(testCaseConfigs: any[], configDir: string): TestCase[] {
    return testCaseConfigs
      .filter(config => !config.skipReason)
      .map(config => this.createTestCaseFromConfig(config, configDir));
  }

  private readConfigFile(configFile: string): any[] {
    const fs = require('fs');
    const configContent = fs.readFileSync(configFile, 'utf8');
    return JSON.parse(configContent);
  }

  private createTestCaseFromConfig(config: any, configDir: string): TestCase {
    const inputDir = path.join(configDir, 'input');
    const testCaseParams = this.buildTestCaseParams(config, configDir, inputDir);
    return new FixtureTestCase(...testCaseParams);
  }

  private buildTestCaseParams(config: any, configDir: string, inputDir: string): [string, string, string[], string, string, string, boolean, string, string, string] {
    const baseName = path.basename(configDir);
    const expectedTsFile = path.join(configDir, `${config.id}.expected.ts`);
    const receivedTsFile = path.join(configDir, `${config.id}.received.ts`);
    const expectedDir = path.join(configDir, `${config.id}.expected`);
    
    return [
      `${baseName}/${config.id}`,
      config.description,
      [config.command],
      inputDir,
      expectedTsFile,
      receivedTsFile,
      false,
      inputDir,
      expectedDir,
      config.id
    ];
  }
}