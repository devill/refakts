/**
 * @description Extract variable should respect function scope boundaries
 * @command refakts extract-variable scope-isolation.input.ts --query "BinaryExpression[left.name='a'][right.name='b']" --name "sum" --all
 */

function first(a: number, b: number): number {
  return a + b;
}

function second(a: number, b: number): number {
  const result = a + b + 10;
  return result;
}