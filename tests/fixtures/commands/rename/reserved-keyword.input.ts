/**
 * @description Test error handling for renaming to reserved keyword
 * @command rename "[{{CURRENT_FILE}} 7:9-7:15]" --to "class"
 * @expect-error true
 * @skip GitHub issue #32
 */
function example() {
  const result = 42 + 58;
  return result;
}