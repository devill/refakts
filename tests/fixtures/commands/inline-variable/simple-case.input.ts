/**
 * @description Inline a single variable
 * @command refakts inline-variable "[simple-case.input.ts 8:10-8:14]"
 */

function calculateArea(width: number, height: number): number {
  const area = width * height;
  return area;
}