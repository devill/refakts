/**
 * @description Extract variable should respect function scope boundaries
 * @command refakts extract-variable "[scope-isolation.input.ts 7:10-7:15]" --name "sum" --all
 */

function first(a: number, b: number): number {
    const sum = a + b;
  return sum;
}

function second(a: number, b: number): number {
    const sum = a + b;
  const result = sum + 10;
  return result;
}