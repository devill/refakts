import * as fs from 'fs';

export function normalizeFixturePath(fixturePath: string): string {
  return fixturePath.endsWith('.input.ts') 
    ? fixturePath 
    : `${fixturePath}.input.ts`;
}

export function validateFixtureExists(normalizedPath: string): void {
  if (!fs.existsSync(normalizedPath)) {
    console.error(`Fixture not found: ${normalizedPath}`);
    process.exit(1);
  }
}