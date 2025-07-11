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
    const testCaseId = config.id;
    const baseName = path.basename(configDir);
    
    return new FixtureTestCase(
      `${baseName}/${testCaseId}`,
      config.description,
      [config.command],
      inputDir,
      this.getExpectedFilePath(configDir, testCaseId),
      this.getReceivedFilePath(configDir, testCaseId),
      false,
      inputDir,
      this.getExpectedDirPath(configDir, testCaseId),
      testCaseId
    );
  }

  private getExpectedFilePath(configDir: string, testCaseId: string): string {
    return path.join(configDir, `${testCaseId}.expected.ts`);
  }

  private getReceivedFilePath(configDir: string, testCaseId: string): string {
    return path.join(configDir, `${testCaseId}.received.ts`);
  }

  private getExpectedDirPath(configDir: string, testCaseId: string): string {
    return path.join(configDir, `${testCaseId}.expected`);
  }
}