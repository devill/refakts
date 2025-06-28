/**
 * @description Inline variable with array access
 * @command refakts inline-variable array-access.input.ts --query "Identifier[name='first']"
 */

function getFirst(arr: number[]): number {
  return arr[0] + 1;
}