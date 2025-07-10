/**
 * @description Extract all occurrences of same expression
 * @command refakts extract-variable "[multiple-occurrences.input.ts 7:15-7:20]" --name "product" --all
 */

function calculate(x: number, y: number): number {
  const sum = x * y + x * y;
  const difference = x * y - 10;
  return sum + difference;
}