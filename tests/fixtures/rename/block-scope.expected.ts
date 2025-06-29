/**
 * @description Rename variable in block scope
 * @command refakts rename block-scope.input.ts --query "IfStatement Block VariableDeclaration Identifier[name='temp']" --to "temporaryValue"
 */

function processValue(condition: boolean, input: number): number {
  const temporaryValue = input; // This should not be renamed
  
  if (condition) {
    const temporaryValue = input * 2; // This should be renamed
    console.log(temporaryValue);
    return temporaryValue + 1;
  }
  
  return temporaryValue;
}