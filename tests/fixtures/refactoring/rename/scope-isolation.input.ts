/**
 * @skip
 * @description Rename variable should only affect the targeted scope, not same-named variables in other scopes
 * @command refakts rename scope-isolation.input.ts --query "VariableDeclaration Identifier[name='data']" --to "processedData"
 */

function outerFunction() {
  const data = "outer";
  console.log(data);
  
  function innerFunction() {
    const data = "inner";
    return data.toUpperCase();
  }
  
  return innerFunction();
}

const globalData = "global";
function anotherFunction() {
  const data = "another";
  return data;
}