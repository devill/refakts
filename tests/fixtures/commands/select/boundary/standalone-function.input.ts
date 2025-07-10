/**
 * @description Test boundary selection on standalone function
 * @command refakts select standalone-function.input.ts --regex "calculateTotal" --boundaries "function"
 * @skip
 */

// Standalone function declaration
function calculateTotal() {
  const tax = price * 0.1;
  return price + tax;
}

const result = calculateTotal();