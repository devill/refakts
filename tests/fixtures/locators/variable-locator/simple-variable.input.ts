/**
 * @description Find simple variable declaration and usage
 * @command variable-locator simple-variable.input.ts --query "VariableDeclaration Identifier[name='count']"
 */

function example() {
  const count = 42;
  console.log(count);
  return count + 1;
}