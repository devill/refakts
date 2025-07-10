import * as fs from 'fs';
import * as path from 'path';
import {TestCase, TestMeta} from '../types/test-case-types';
import {extractMetaFromFile} from '../parsers/meta-parser';
import {FixtureLocation} from '../fixture-location';

export class TestCaseFactory {

  static createSingleFileTestCases(testDir: string, testPath: string, expectedExtension: string, files: string[]): TestCase[] {
    return FixtureLocation.createSingleFileTestCases(testDir, testPath, expectedExtension, files);
  }

  static createInputTestCase(inputFile: string): TestCase | null {
    const meta = this.extractMetaFromInputFile(inputFile);
    if (!meta.commands || meta.commands.length === 0) {
      return null;
    }
    
    return FixtureLocation.createTestCaseFromInputFile(inputFile);
  }

  private static extractMetaFromInputFile(inputPath: string): TestMeta {
    const content = fs.readFileSync(inputPath, 'utf8');
    return extractMetaFromFile(content);
  }
}