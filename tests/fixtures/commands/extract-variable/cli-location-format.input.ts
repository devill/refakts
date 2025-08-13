/**
 * @description CLI location format fix - validation happens after location is added to options
 * @command extract-variable "[{{CURRENT_FILE}} 6:18-6:23]" --name "sum"
 */
function example() {
  const result = 2 + 3;
  return result;
}