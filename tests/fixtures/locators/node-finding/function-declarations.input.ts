/**
 * @description Find function declarations
 * @command node-finding function-declarations.input.ts --query "FunctionDeclaration"
 */

function calculateArea(width: number, height: number): number {
  const area = width * height;
  return area;
}

function calculatePerimeter(width: number, height: number): number {
  return 2 * (width + height);
}