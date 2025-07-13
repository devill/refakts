import * as fs from 'fs';
import { TestUtilities } from './test-utilities';

export class FileCleanupMixin {
  static cleanupReceivedFiles(receivedFiles: any, testPassed: boolean): void {
    Object.values(receivedFiles).forEach((file: any) => {
      if (fs.existsSync(file)) {
        TestUtilities.cleanupSingleFile(file, testPassed);
      }
    });
  }
}