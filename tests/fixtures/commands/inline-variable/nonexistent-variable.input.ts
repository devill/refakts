/**
 * @description Test error handling for non-existent variable
 * @command inline-variable "[{{CURRENT_FILE}} 5:1-5:5]"
 * @expect-error true
 */
function example() {
  const result = 42 + 58;
  return result;
}