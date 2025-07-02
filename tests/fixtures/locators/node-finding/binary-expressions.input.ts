/**
 * @description Find binary expressions with detailed scope info
 * @command node-finding binary-expressions.input.ts --query "BinaryExpression" --expressions
 */

function outerFunction() {
  const result = 5 + 3;
  
  function innerFunction() {
    const multiplication = result * 2;
    return multiplication + 1;
  }
  
  return innerFunction();
}