/**
 * @description Find simple variable declaration and usage
 * @command variable-locator "[simple-variable.input.ts 7:9-7:14]"
 */

function example() {
  const count = 42;
  console.log(count);
  return count + 1;
}