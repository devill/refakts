/**
 * @description Extract expression from nested function calls
 * @command refakts extract-variable nested-calls.input.ts --query "BinaryExpression" --name "sum"
 */

function process(x: number, y: number): number {
  return Math.sqrt(Math.abs(x + y));
}