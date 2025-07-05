/**
 * @description Test error handling for invalid selection range
 * @command extract-variable "[invalid-selection.input.ts 10:1-10:5]"
 * @expect-error true
 */
function example() {
  const result = 42 + 58;
  return result;
}