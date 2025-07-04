import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('CLI Location Format Fix', () => {
  const testFile = path.join(__dirname, '../fixtures/temp-test.ts');
  
  beforeEach(() => {
    // Create a test file
    fs.writeFileSync(testFile, `
function example() {
  const result = 2 + 3;
  return result;
}
`.trim());
  });

  afterEach(() => {
    // Clean up
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
  });

  it('should work correctly with location format after fixing validation timing', () => {
    // This test ensures the fix works - validation happens after location is added to options
    const cmd = `npm run dev -- extract-variable "[${testFile} 2:17-2:22]" --name "sum"`;
    
    // Should not throw an error now that validation happens at the right time
    expect(() => {
      execSync(cmd, { stdio: 'pipe', encoding: 'utf8' });
    }).not.toThrow();
  });
});