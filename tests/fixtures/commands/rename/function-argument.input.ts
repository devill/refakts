/**
 * @description Rename a function argument
 * @command refakts rename "[{{CURRENT_FILE}} 6:22-6:30]" --to "newParam"
 */

function processData(oldParam: string, other: number): string {
  const result = oldParam.toUpperCase();
  return oldParam + result + other;
}