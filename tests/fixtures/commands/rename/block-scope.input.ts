/**
 * @description Rename variable in block scope
 * @command refakts rename "[block-scope.input.ts 10:11-10:15]" --to "temporaryValue"
 */

function processValue(condition: boolean, input: number): number {
  const temp = input; // This should not be renamed
  
  if (condition) {
    const temp = input * 2; // This should be renamed
    console.log(temp);
    return temp + 1;
  }
  
  return temp;
}