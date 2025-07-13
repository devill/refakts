import * as fs from 'fs';
import * as path from 'path';

export class GoldenFileTestUtility {
  static expectToMatchGoldenFile(
    result: string,
    expectedDir: string,
    fileName: string
  ): void {
    const expectedPath = path.join(expectedDir, fileName);
    const expected = this.getOrCreateExpectedContent(expectedPath, result);
    expect(result).toBe(expected);
  }

  private static getOrCreateExpectedContent(expectedPath: string, result: string): string {
    if (!fs.existsSync(expectedPath)) {
      fs.writeFileSync(expectedPath, result);
    }
    return fs.readFileSync(expectedPath, 'utf8');
  }
}