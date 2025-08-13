/**
 * @description Test error handling for missing --name option
 * @command extract-variable "[{{CURRENT_FILE}} 2:17-2:25]"
 * @expect-error true
 */
function example() {
  const result = 42 + 58;
  return result;
}