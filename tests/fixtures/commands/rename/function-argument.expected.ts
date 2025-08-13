/**
 * @description Rename a function argument
 * @command refakts rename "[{{CURRENT_FILE}} 6:22-6:30]" --to "newParam"
 */

function processData(newParam: string, other: number): string {
  const result = newParam.toUpperCase();
  return newParam + result + other;
}