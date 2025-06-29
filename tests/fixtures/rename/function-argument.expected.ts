/**
 * @description Rename a function argument
 * @command refakts rename function-argument.input.ts --query "Parameter Identifier[name='oldParam']" --to "newParam"
 */

function processData(newParam: string, other: number): string {
  const result = newParam.toUpperCase();
  return newParam + result + other;
}