/**
 * @description Test error handling for invalid selection range
 * @command extract-variable "[{{CURRENT_FILE}} 10:1-10:5]" --name extracted
 * @expect-error true
 */
function example() {
  const result = 42 + 58;
  return result;
}