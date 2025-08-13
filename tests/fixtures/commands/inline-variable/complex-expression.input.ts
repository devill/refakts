/**
 * @description Inline variable with complex expression
 * @command refakts inline-variable "[{{CURRENT_FILE}} 8:10-8:14]"
 */

function complexCalc(a: number, b: number, c: number): number {
  const expr = (a + b) * c - Math.sqrt(a);
  return expr + 10;
}