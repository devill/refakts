/**
 * @description Rename variable should only affect the targeted scope, not same-named variables in other scopes
 * @command refakts rename "[{{CURRENT_FILE}} 7:9-7:13]" --to "processedData"
 */

function outerFunction() {
  const processedData = "outer";
  console.log(processedData);
  
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