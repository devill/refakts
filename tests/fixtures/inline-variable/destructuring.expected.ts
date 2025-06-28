/**
 * @description Inline variable using destructuring assignment
 * @command refakts inline-variable destructuring.input.ts --query "Identifier[name='x']"
 */

function getCoordinate(point: { x: number; y: number }): number {
  return point.x * 2;
}