/**
 * @description Test error handling for readonly files
 * @command extract-variable "[readonly-file.input.ts 2:17-2:25]"
 * @expect-error true
 */
function example() {
  const result = 42 + 58;
  return result;
}