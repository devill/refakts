import * as fs from 'fs';

export class FileManager {
  readFile(filePath: string): string {
    this.validateFileExists(filePath);
    return fs.readFileSync(filePath, 'utf8');
  }

  writeFile(filePath: string, content: string): void {
    fs.writeFileSync(filePath, content);
  }

  private validateFileExists(filePath: string): void {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
  }
}