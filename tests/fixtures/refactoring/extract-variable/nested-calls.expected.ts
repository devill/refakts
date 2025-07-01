/**
 * @description Extract expression from nested function calls
 * @command refakts extract-variable nested-calls.input.ts --query "BinaryExpression" --name "sum"
 */

function process(x: number, y: number): number {
    const sum = x + y;
  return Math.sqrt(Math.abs(sum));
}