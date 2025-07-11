// Valid TypeScript file for error condition testing

export function testFunc(): void {
  console.log('This is a valid function');
}

export const VALID_CONSTANT = 42;

export class ValidClass {
  private value: string = 'test';
  
  getValue(): string {
    return this.value;
  }
}