/**
 * @description Rename a variable using location format
 * @command refakts rename "[{{CURRENT_FILE}} 7:8-7:11]" --to "newName"
 */

function test() {
  const temp = 42;
  return temp;
}