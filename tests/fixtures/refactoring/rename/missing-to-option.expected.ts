/**
 * @description Test error handling for missing --to option
 * @command rename "[missing-to-option.input.ts 2:9-2:15]"
 * @expect-error true
 */
function example() {
  const result = 42 + 58;
  return result;
}