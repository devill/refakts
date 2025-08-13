/**
 * @description Test error handling for destructuring without initializer
 * @command inline-variable "[{{CURRENT_FILE}} 7:9-7:10]"
 * @expect-error true
 */
function example() {
  const { x };
  return x;
}