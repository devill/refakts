/**
 * @description Test error handling for destructuring without initializer
 * @command inline-variable "[destructuring-no-initializer.input.ts 7:9-7:10]"
 * @expect-error true
 */
function example() {
  const { x };
  return x;
}