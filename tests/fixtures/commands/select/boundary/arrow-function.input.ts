/**
 * @description Test boundary selection on arrow function
 * @command refakts select arrow-function.input.ts --regex "handler" --boundaries "function"
 * @skip GitHub issue #67
 */

// Arrow function in assignment
const handler = (event) => {
  event.preventDefault();
  return false;
};

document.onclick = handler;