/**
 * @description Inline variable with multiple usages
 * @command refakts inline-variable multiple-usages.input.ts --query "Identifier[name='sum']"
 */

function processData(x: number, y: number): number {
  const result = (x + y) * 2 + (x + y);
  return result;
}