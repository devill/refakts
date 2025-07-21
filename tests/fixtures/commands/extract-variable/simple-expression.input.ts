/**
 * @description Extract a simple arithmetic expression
 * @command refakts extract-variable "[simple-expression.input.ts 7:10-7:24]" --name "area"
 */

function calculateArea(width: number, height: number): number {
  return width * height;
}