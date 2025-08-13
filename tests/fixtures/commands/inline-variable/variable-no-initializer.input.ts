/**
 * @description Test error handling for variable without initializer
 * @command inline-variable "[{{CURRENT_FILE}} 7:7-7:8]"
 * @expect-error true
 */
function example() {
  let x;
  return x;
}