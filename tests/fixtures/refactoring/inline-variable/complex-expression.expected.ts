/**
 * @description Inline variable with complex expression
 * @command refakts inline-variable "[complex-expression.input.ts 8:10-8:14]"
 */

function complexCalc(a: number, b: number, c: number): number {
  return (a + b) * c - Math.sqrt(a) + 10;
}