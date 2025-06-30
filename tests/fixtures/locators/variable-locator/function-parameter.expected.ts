/**
 * Expected output: JSON describing parameter declaration and all usages
 * Declaration: line 6, column 19 (value: number)
 * Usages: line 7, column 19 (value * 2), line 8, column 6 (value > 0), line 9, column 11 (return value)
 */

function processValue(value: number) {
  const doubled = value * 2;
  if (value > 0) {
    return value;
  }
  return doubled;
}