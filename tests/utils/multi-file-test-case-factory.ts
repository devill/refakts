import * as path from 'path';
import {FixtureTestCase, TestCase} from './test-case-loader';

import fs from "fs";

export class MultiFileTestCaseFactory {
  createFromConfigFile(configFile: string): TestCase[] {
    const testCaseConfigs = this.readConfigFile(configFile);
    const configDir = path.dirname(configFile);
    
    return this.createTestCases(testCaseConfigs, configDir);
  }

  private createTestCases(testCaseConfigs: any[], configDir: string): TestCase[] {
    return testCaseConfigs
      .map(config => this.createTestCaseFromConfig(config, configDir));
  }

  private readConfigFile(configFile: string): any[] {
    const configContent = fs.readFileSync(configFile, 'utf8');
    return JSON.parse(configContent);
  }

  private createTestCaseFromConfig(config: any, configDir: string): TestCase {
    return FixtureTestCase.create(config, configDir);
  }
}