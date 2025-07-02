/**
 * @description Find function declarations
 * @command refakts node-finding basic-nodes.input.ts --query "FunctionDeclaration"
 */

function calculateArea(width: number, height: number): number {
  const area = width * height;
  return area;
}

function calculatePerimeter(width: number, height: number): number {
  return 2 * (width + height);
}