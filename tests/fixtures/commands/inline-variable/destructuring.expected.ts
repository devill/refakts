/**
 * @description Inline variable using destructuring assignment
 * @command refakts inline-variable "[{{CURRENT_FILE}} 8:10-8:11]"
 */

function getCoordinate(point: { x: number; y: number }): number {
  return point.x * 2;
}