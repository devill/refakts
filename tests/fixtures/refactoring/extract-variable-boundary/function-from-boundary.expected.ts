// Test extracting a function found via boundary selection
const numbers = [1, 2, 3];

const extracted = function doubleValue(x) {
  return x * 2;
};

const doubled = numbers.map(doubleValue);