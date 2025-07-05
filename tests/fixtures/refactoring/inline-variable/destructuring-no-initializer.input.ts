/**
 * @description Test error handling for destructuring without initializer
 * @command inline-variable "[destructuring-no-initializer.input.ts 2:9-2:10]"
 * @expect-error true
 */
function example() {
  const { x };
  return x;
}