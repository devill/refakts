/**
 * @description Inline variable with array access
 * @command refakts inline-variable array-access.input.ts --query "Identifier[name='first']"
 */

function getFirst(arr: number[]): number {
  const first = arr[0];
  return first + 1;
}