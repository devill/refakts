/**
 * @description Test error handling for renaming to reserved keyword
 * @command rename "[reserved-keyword.input.ts 2:9-2:15]" --to "class"
 * @expect-error true
 */
function example() {
  const result = 42 + 58;
  return result;
}