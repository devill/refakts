import * as fs from 'fs';
import * as path from 'path';

export class DocumentationTestHelper {
  static expectToMatchExpectedFile(result: string, expectedDir: string, fileName: string): void {
    const expectedPath = path.join(expectedDir, fileName);
    
    if (!fs.existsSync(expectedPath)) {
      fs.writeFileSync(expectedPath, result);
    }
    
    const expected = fs.readFileSync(expectedPath, 'utf8');
    expect(result).toBe(expected);
  }
}