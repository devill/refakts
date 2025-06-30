/**
 * @description Find function parameter declaration and usages
 * @command variable-locator function-parameter.input.ts --query "Parameter Identifier[name='value']"
 */

function processValue(value: number) {
  const doubled = value * 2;
  if (value > 0) {
    return value;
  }
  return doubled;
}