/**
 * @description Test error handling for complex variable dependencies
 * @command inline-variable "[complex-dependency.input.ts 2:7-2:12]"
 * @expect-error true
 */
function example() {
  const state = { count: 0 };
  state.count++;
  return state.count;
}