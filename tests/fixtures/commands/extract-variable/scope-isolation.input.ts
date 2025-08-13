/**
 * @description Extract variable should respect function scope boundaries
 * @command refakts extract-variable "[{{CURRENT_FILE}} 7:10-7:15]" --name "sum" --all
 */

function first(a: number, b: number): number {
  return a + b;
}

function second(a: number, b: number): number {
  const result = a + b + 10;
  return result;
}