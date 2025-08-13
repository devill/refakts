/**
 * @description Test error handling for complex variable dependencies
 * @command inline-variable "[{{CURRENT_FILE}} 7:9-7:14]"
 * @expect-error true
 * @skip GitHub issue #30
 */
function example() {
  const state = { count: 0 };
  state.count++;
  return state.count;
}