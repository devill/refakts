// Test fixtures for ExtractionScopeAnalyzer unit tests

export const simpleFunction = `
function calculateTotal(a: number, b: number): number {
  const sum = a + b;
  return sum;
}
`;

export const nestedScopes = `
function outerFunction(x: number) {
  const outerVar = x * 2;
  
  if (true) {
    const innerVar = outerVar + 1;
    console.log(innerVar);
  }
  
  return outerVar;
}
`;

export const classWithMethods = `
class Calculator {
  private value: number = 0;
  
  constructor(initialValue: number) {
    this.value = initialValue;
  }
  
  add(amount: number): number {
    const result = this.value + amount;
    return result;
  }
  
  subtract(amount: number): number {
    return this.value - amount;
  }
}
`;

export const arrowFunctions = `
const multiply = (a: number, b: number) => {
  const result = a * b;
  return result;
};

const divide = (a: number, b: number) => a / b;
`;

export const complexNesting = `
function processData(data: any[]) {
  const processed = data.map(item => {
    if (item.valid) {
      const transformed = item.value.toString();
      return transformed.toUpperCase();
    }
    return 'INVALID';
  });
  
  return processed;
}
`;

export const moduleLevel = `
const config = { debug: true };
console.log('Module loaded');
`;