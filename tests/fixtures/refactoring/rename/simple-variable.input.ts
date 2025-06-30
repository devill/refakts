/**
 * @description Rename a simple local variable
 * @command refakts rename simple-variable.input.ts --query "VariableDeclaration Identifier[name='oldName']" --to "newName"
 */

function calculateArea(width: number, height: number): number {
  const oldName = width * height;
  return oldName * 2;
}