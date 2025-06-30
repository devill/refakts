/**
 * @description Find variable with different usage types (read, write, update)
 * @command variable-locator usage-types.input.ts --query "VariableDeclaration Identifier[name='counter']"
 */

function demonstrateUsageTypes() {
  let counter = 0;
  console.log(counter);
  counter = 10;
  counter += 5;
  counter++;
  return counter;
}