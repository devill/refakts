/**
 * @description Extract a simple arithmetic expression
 * @command refakts extract-variable simple-expression.input.ts --query "BinaryExpression" --name "area"
 */

function calculateArea(width: number, height: number): number {
    const area = width * height;
  return area;
}