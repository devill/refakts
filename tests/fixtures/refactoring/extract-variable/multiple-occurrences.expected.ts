/**
 * @description Extract all occurrences of same expression
 * @command refakts extract-variable multiple-occurrences.input.ts --query "BinaryExpression[left.name='x'][right.name='y']" --name "product" --all
 */

function calculate(x: number, y: number): number {
    const product = x * y;
  const sum = product + product;
  const difference = product - 10;
  return sum + difference;
}