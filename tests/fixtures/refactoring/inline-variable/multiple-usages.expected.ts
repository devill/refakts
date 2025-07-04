/**
 * @description Inline variable with multiple usages
 * @command refakts inline-variable "[multiple-usages.input.ts 8:18-8:21]"
 */

function processData(x: number, y: number): number {
  const result = (x + y) * 2 + (x + y);
  return result;
}