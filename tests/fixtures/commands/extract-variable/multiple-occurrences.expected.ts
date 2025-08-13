/**
 * @description Extract all occurrences of same expression
 * @command refakts extract-variable "[{{CURRENT_FILE}} 7:15-7:20]" --name "product" --all
 */

function calculate(x: number, y: number): number {
    const product = x * y;
  const sum = product + product;
  const difference = product - 10;
  return sum + difference;
}