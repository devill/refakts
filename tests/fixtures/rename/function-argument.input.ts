/**
 * @skip
 * @description Rename a function argument
 * @command refakts rename function-argument.input.ts --query "Parameter Identifier[name='oldParam']" --to "newParam"
 */

function processData(oldParam: string, other: number): string {
  const result = oldParam.toUpperCase();
  return oldParam + result + other;
}