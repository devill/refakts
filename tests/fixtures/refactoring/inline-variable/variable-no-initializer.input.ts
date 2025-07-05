/**
 * @description Test error handling for variable without initializer
 * @command inline-variable "[variable-no-initializer.input.ts 2:7-2:8]"
 * @expect-error true
 */
function example() {
  let x;
  x = 42;
  return x;
}