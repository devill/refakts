import * as fs from 'fs';

export class TestUtilities {
  static normalizePaths(content: string): string {
    return content.replace(new RegExp(process.cwd().replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&'), 'g'), '.');
  }

  static createMismatchError(receivedFile: string, expected: string, received: string): Error {
    return new Error(`Content mismatch in ${receivedFile}.
Expected:
${expected}
Received:
${received}`);
  }

  static readAndNormalizeFiles(expectedFile: string, receivedFile: string) {
    return {
      normalizedExpected: TestUtilities.normalizePaths(fs.readFileSync(expectedFile, 'utf8').trim()),
      normalizedReceived: TestUtilities.normalizePaths(fs.readFileSync(receivedFile, 'utf8').trim())
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
    } else {
      TestUtilities.validateOrphanedReceivedFile(receivedFile, expectedFile);
    }
  }

  private static validateOrphanedReceivedFile(receivedFile: string, expectedFile: string): void {
    if (fs.existsSync(receivedFile)) {
      if (receivedFile.endsWith('.out') || receivedFile.endsWith('.err')) {
        if (fs.readFileSync(receivedFile, 'utf8').trim()) {
          throw new Error(`Received file ${receivedFile} exists but no corresponding expected file ${expectedFile} found. ` +
            `If this output is correct, create the expected file: cp "${receivedFile}" "${expectedFile}"`);
        }
      }
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
