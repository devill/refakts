import * as fs from 'fs';

export class TestUtilities {
  static normalizePaths(content: string): string {
    const projectRoot = process.cwd();
    return content.replace(new RegExp(projectRoot.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&'), 'g'), '.');
  }

  static createMismatchError(receivedFile: string, expected: string, received: string): Error {
    return new Error(`Content mismatch in ${receivedFile}.
Expected:
${expected}
Received:
${received}`);
  }

  static readAndNormalizeFiles(expectedFile: string, receivedFile: string) {
    const expected = fs.readFileSync(expectedFile, 'utf8').trim();
    const received = fs.readFileSync(receivedFile, 'utf8').trim();
    
    return {
      normalizedExpected: TestUtilities.normalizePaths(expected),
      normalizedReceived: TestUtilities.normalizePaths(received)
    };
  }

  static compareFileContents(expectedFile: string, receivedFile: string): void {
    const { normalizedExpected, normalizedReceived } = TestUtilities.readAndNormalizeFiles(expectedFile, receivedFile);
    
    if (normalizedReceived !== normalizedExpected) {
      throw TestUtilities.createMismatchError(receivedFile, normalizedExpected, normalizedReceived);
    }
  }

  static validateReceivedFileExists(expectedFile: string, receivedFile: string): void {
    if (!fs.existsSync(receivedFile)) {
      throw new Error(`Expected file ${expectedFile} exists but received file ${receivedFile} was not generated`);
    }
  }

  static compareIfExpected(expectedFile: string, receivedFile: string): void {
    if (fs.existsSync(expectedFile)) {
      TestUtilities.validateReceivedFileExists(expectedFile, receivedFile);
      TestUtilities.compareFileContents(expectedFile, receivedFile);
    }
  }

  static writeOutputIfPresent(filePath: string, output: string): void {
    if (output.trim()) {
      fs.writeFileSync(filePath, output.trim());
    }
  }

  static cleanupSingleFile(file: string, testPassed: boolean): void {
    if (testPassed) {
      fs.unlinkSync(file);
    }
  }
}