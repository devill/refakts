/**
 * @description Test extracting function using boundary-selected location
 * @command refakts extract-variable "[function-from-boundary.input.ts 4:1-6:2]" --name "extracted"
 * @skip
 */

// Test extracting a function found via boundary selection
const numbers = [1, 2, 3];

function doubleValue(x) {
  return x * 2;
}

const doubled = numbers.map(doubleValue);