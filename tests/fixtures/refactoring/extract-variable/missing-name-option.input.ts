/**
 * @description Test error handling for missing --name option
 * @command extract-variable "[missing-name-option.input.ts 2:17-2:25]"
 * @expect-error true
 */
function example() {
  const result = 42 + 58;
  return result;
}