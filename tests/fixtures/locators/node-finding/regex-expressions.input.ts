/**
 * @description Find expressions containing variable 'result' using regex
 * @command node-finding regex-expressions.input.ts --regex "result" --expressions
 */

function processResults() {
  const result = 42;
  const finalResult = result * 2;
  const calculation = result + 10;
  const otherVar = 100;
  
  return finalResult + calculation;
}