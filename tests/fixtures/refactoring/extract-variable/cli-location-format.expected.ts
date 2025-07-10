/**
 * @description CLI location format fix - validation happens after location is added to options
 * @command extract-variable "[cli-location-format.input.ts 6:18-6:23]" --name "sum"
 */
function example() {
    const sum = 2 + 3;
  const result = sum;
  return result;
}