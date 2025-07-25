export const simpleFunction = `
function calculate(input: number): number {
  const result = input * 2;
  const output = result + 10;
  return output;
}
`;

export const functionWithParameters = `
function processData(data: any[], options: object, callback: Function): void {
  const processed = data.map(item => item.value);
  const config = options || {};
  callback(processed, config);
}
`;

export const nestedScopes = `
function outerFunction(param1: string) {
  const outerVar = param1.toUpperCase();
  
  function innerFunction(param2: number) {
    const innerVar = param2 * 2;
    const anotherVar = outerVar + innerVar.toString();
    return anotherVar;
  }
  
  return innerFunction;
}
`;

export const classScope = `
class Calculator {
  private value: number;
  
  constructor(initialValue: number) {
    this.value = initialValue;
  }
  
  calculate(input: number, factor: number): number {
    const base = this.value;
    const multiplied = input * factor;
    const result = base + multiplied;
    return result;
  }
}
`;

export const destructuringParameters = `
function handleRequest({ url, method }: { url: string; method: string }, options: any) {
  const normalizedUrl = url.toLowerCase();
  const upperMethod = method.toUpperCase();
  return { normalizedUrl, upperMethod, options };
}
`;

export const arrowFunctions = `
const processor = (items: any[]) => {
  const filtered = items.filter(item => item.active);
  const transformed = filtered.map(item => {
    const converted = item.value.toString();
    return converted;
  });
  return transformed;
};
`;

export const emptyScope = `
function emptyFunction() {
  // No variables here
}
`;

export const moduleLevel = `
const globalVar = 'global';
const anotherGlobal = 42;
let mutableGlobal = true;
`;