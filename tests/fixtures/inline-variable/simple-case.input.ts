/**
 * @description Inline a single variable
 * @command refakts inline-variable simple-case.input.ts --query "ReturnStatement Identifier[name='area']"
 */

function calculateArea(width: number, height: number): number {
  const area = width * height;
  return area;
}