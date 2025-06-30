/**
 * Expected output: JSON describing variable declaration and all usages
 * Declaration: line 7, column 8 (const count = 42)
 * Usages: line 8, column 15 (console.log(count)) and line 9, column 9 (return count + 1)
 */

function example() {
  const count = 42;
  console.log(count);
  return count + 1;
}