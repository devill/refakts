// Test fixtures for StatementInserter unit tests

export const functionWithStatements = `
function processData(input: number): number {
  const doubled = input * 2;
  const result = doubled + 10;
  return result;
}
`;

export const blockScope = `
function testFunction() {
  if (true) {
    const localVar = 42;
    console.log(localVar);
  }
}
`;

export const moduleLevel = `
const config = { debug: true };
const version = '1.0.0';
console.log(config);
`;

export const nestedBlocks = `
function complexFunction() {
  const outer = 1;
  
  if (outer > 0) {
    const middle = outer * 2;
    
    for (let i = 0; i < middle; i++) {
      const inner = i + middle;
      console.log(inner);
    }
  }
}
`;

export const arrowFunctionBlock = `
const handler = (data: any) => {
  const processed = data.map(item => item.value);
  return processed;
};
`;

export const expressionOnly = `a + b`;