import { GoldenFileTestUtility } from '../../utils/golden-file-test-utility';

export class DocumentationTestHelper {
  static expectToMatchExpectedFile(result: string, expectedDir: string, fileName: string): void {
    GoldenFileTestUtility.expectToMatchGoldenFile(result, expectedDir, fileName);
  }
}