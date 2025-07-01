/**
 * @description Extract variable with non-conflicting name
 * @command refakts extract-variable name-conflict.input.ts --query "ReturnStatement BinaryExpression[left.name='x'][right.name='y']" --name "product"
 */

function calculate(x: number, y: number): number {
  const result = x + y;
  return result + x * y;
}