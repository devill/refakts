// Broken TypeScript file with syntax errors

export function brokenFunc(: void {  // Missing parameter name
  console.log('This has syntax errors');
}

export const BROKEN_CONSTANT = 'missing semicolon'

// Missing closing brace
export class BrokenClass {
  private value: string = 'test';
  
  getValue(): string {
    return this.value;
  // Missing closing brace for method and class