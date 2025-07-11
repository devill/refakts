import * as path from 'path';
import { TestCase, FixtureTestCase } from './test-case-loader';

export class MultiFileTestCaseFactory {
  createFromConfigFile(configFile: string): TestCase[] {
    const testCaseConfigs = this.readConfigFile(configFile);
    const configDir = path.dirname(configFile);
    
    const testCases: TestCase[] = [];
    for (const config of testCaseConfigs) {
      if (config.skipReason) {
        continue;
      }
      
      const testCase = this.createTestCaseFromConfig(config, configDir);
      testCases.push(testCase);
    }
    
    return testCases;
  }

  private readConfigFile(configFile: string): any[] {
    const fs = require('fs');
    const configContent = fs.readFileSync(configFile, 'utf8');
    return JSON.parse(configContent);
  }

  private createTestCaseFromConfig(config: any, configDir: string): TestCase {
    const inputDir = path.join(configDir, 'input');
    return new FixtureTestCase(
      `${path.basename(configDir)}/${config.id}`,
      config.description,
      [config.command],
      inputDir,
      path.join(configDir, `${config.id}.expected.ts`),
      path.join(configDir, `${config.id}.received.ts`),
      false,
      inputDir,
      path.join(configDir, `${config.id}.expected`),
      config.id
    );
  }
}