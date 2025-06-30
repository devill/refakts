/**
 * @description Rename a simple local variable
 * @command refakts rename simple-variable.input.ts --query "VariableDeclaration Identifier[name='oldName']" --to "newName"
 */

function calculateArea(width: number, height: number): number {
  const newName = width * height;
  return newName * 2;
}