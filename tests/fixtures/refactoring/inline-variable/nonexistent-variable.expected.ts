/**
 * @description Test error handling for non-existent variable
 * @command inline-variable "[nonexistent-variable.input.ts 5:1-5:5]"
 * @expect-error true
 */
function example() {
  const result = 42 + 58;
  return result;
}