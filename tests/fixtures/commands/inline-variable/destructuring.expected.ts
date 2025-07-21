/**
 * @description Inline variable using destructuring assignment
 * @command refakts inline-variable "[destructuring.input.ts 8:10-8:11]"
 */

function getCoordinate(point: { x: number; y: number }): number {
  return point.x * 2;
}