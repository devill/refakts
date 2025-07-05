/**
 * @description Test error handling for invalid identifier location
 * @command rename "[invalid-identifier.input.ts 3:1-3:5]"
 * @expect-error true
 */
function example() {
  const result = 42 + 58;
  return result;
}