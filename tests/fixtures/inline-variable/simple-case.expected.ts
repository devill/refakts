/**
 * @description Inline a single variable
 * @command refakts inline-variable simple-case.input.ts --query "Identifier[name='area']"
 */

function calculateArea(width: number, height: number): number {
  return width * height;
}