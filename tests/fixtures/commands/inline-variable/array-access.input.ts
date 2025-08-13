/**
 * @description Inline variable with array access
 * @command refakts inline-variable "[{{CURRENT_FILE}} 8:10-8:15]"
 */

function getFirst(arr: number[]): number {
  const first = arr[0];
  return first + 1;
}