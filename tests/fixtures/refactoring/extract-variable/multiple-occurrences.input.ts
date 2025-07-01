/**
 * @description Extract all occurrences of same expression
 * @command refakts extract-variable multiple-occurrences.input.ts --query "BinaryExpression[left.name='x'][right.name='y']" --name "product" --all
 */

function calculate(x: number, y: number): number {
  const sum = x * y + x * y;
  const difference = x * y - 10;
  return sum + difference;
}