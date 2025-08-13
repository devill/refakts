/**
 * @description Rename variable in block scope
 * @command refakts rename "[{{CURRENT_FILE}} 10:11-10:15]" --to "temporaryValue"
 */

function processValue(condition: boolean, input: number): number {
  const temp = input; // This should not be renamed
  
  if (condition) {
    const temporaryValue = input * 2; // This should be renamed
    console.log(temporaryValue);
    return temporaryValue + 1;
  }
  
  return temp;
}