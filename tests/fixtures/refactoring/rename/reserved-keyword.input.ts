/**
 * @description Test error handling for renaming to reserved keyword
 * @command rename "[reserved-keyword.input.ts 7:9-7:15]" --to "class"
 * @expect-error true
 * @skip
 */
function example() {
  const result = 42 + 58;
  return result;
}