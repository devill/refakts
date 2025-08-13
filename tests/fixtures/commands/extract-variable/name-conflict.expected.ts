/**
 * @description Extract variable with non-conflicting name
 * @command refakts extract-variable "[{{CURRENT_FILE}} 8:19-8:24]" --name "product"
 */

function calculate(x: number, y: number): number {
  const result = x + y;
    const product = x * y;
  return result + product;
}