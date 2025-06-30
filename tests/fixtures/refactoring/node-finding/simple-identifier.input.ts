/**
 * @description Find identifier by name
 * @command refakts inline-variable simple-identifier.input.ts --query "Identifier[name='area']"
 */

function calculateArea(width: number, height: number): number {
  const area = width * height;
  return area;
}