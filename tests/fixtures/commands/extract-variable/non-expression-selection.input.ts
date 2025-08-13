/**
 * @description Test error handling for selecting non-expression node
 * @command extract-variable "[{{CURRENT_FILE}} 2:1-2:8]" --name "extracted"
 * @expect-error true
 */
function example() {
  const result = 42 + 58;
  return result;
}