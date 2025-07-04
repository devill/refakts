/**
 * @description Find function parameter declaration and usages
 * @command variable-locator "[function-parameter.input.ts 6:23-6:28]"
 */

function processValue(value: number) {
  const doubled = value * 2;
  if (value > 0) {
    return value;
  }
  return doubled;
}