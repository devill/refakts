/**
 * @description Test error handling for selecting non-expression node
 * @command extract-variable "[non-expression-selection.input.ts 2:1-2:8]" --name "extracted"
 * @expect-error true
 */
function example() {
  const result = 42 + 58;
  return result;
}