/**
 * @description Test boundary selection on inline function in expression
 * @command refakts select inline-function.input.ts --regex "transform" --boundaries "function"
 * @skip GitHub issue #67
 */

// Inline function in expression context
const result = [1, 2, 3].map(function transform(x) { 
  return x * 2; 
});

console.log(result);