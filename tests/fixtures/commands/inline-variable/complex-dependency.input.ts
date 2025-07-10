/**
 * @description Test error handling for complex variable dependencies
 * @command inline-variable "[complex-dependency.input.ts 7:9-7:14]"
 * @expect-error true
 * @skip
 */
function example() {
  const state = { count: 0 };
  state.count++;
  return state.count;
}