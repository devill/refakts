import * as path from 'path';
import { TestCase, FixtureTestCase, FixtureTestCaseConfig } from './test-case-loader';

interface FilePaths {
  expectedFile: string;
  receivedFile: string;
  expectedDir: string;
}

interface FixtureConfigParams {
  config: any;
  baseName: string;
  testCaseId: string;
  inputDir: string;
  filePaths: FilePaths;
}

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
    const testCaseId = config.id;
    const baseName = path.basename(configDir);
    const inputDir = path.join(configDir, 'input');
    const filePaths = this.getFilePaths(configDir, testCaseId);
    
    const params: FixtureConfigParams = { config, baseName, testCaseId, inputDir, filePaths };
    const fixtureConfig = this.buildFixtureConfig(params);
    return FixtureTestCase.create(fixtureConfig);
  }

  private buildFixtureConfig(params: FixtureConfigParams): FixtureTestCaseConfig {
    const { config, baseName, testCaseId, inputDir, filePaths } = params;
    return { name: `${baseName}/${testCaseId}`, description: config.description, commands: [config.command], inputFile: inputDir, ...filePaths, skip: false, projectDirectory: inputDir, expectedDirectory: filePaths.expectedDir, testCaseId };
  }

  private getFilePaths(configDir: string, testCaseId: string): FilePaths {
    return {
      expectedFile: this.getExpectedFilePath(configDir, testCaseId),
      receivedFile: this.getReceivedFilePath(configDir, testCaseId),
      expectedDir: this.getExpectedDirPath(configDir, testCaseId)
    };
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