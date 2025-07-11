// Ambiguous symbols testing

export function test(): void {
  console.log('Global test function');
}

export class TestClass {
  test(): void {
    console.log('Class test method');
  }

  static test(): void {
    console.log('Static test method');
  }
}

// Multiple symbols with same name
const test = 'test variable';

function useTest(): void {
  test(); // Which test is this?
  const instance = new TestClass();
  instance.test(); // Method call
  TestClass.test(); // Static call
  console.log(test); // Variable usage
}

// Interface with same name
interface test {
  value: string;
}

// Type alias with same name
type test = string | number;

// Usage in different contexts
const testObj: test = { value: 'interface' };
const testType: test = 'type alias';

export { test as testVariable };