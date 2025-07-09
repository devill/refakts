/**
 * @description Test error handling for invalid target in extract-variable
 * @command extract-variable "[nonexistent-file.ts 1:1-1:10]" --name extracted
 * @expect-error true
 */
function example() {
  const result = 42 + 58;
  return result;
}