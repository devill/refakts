/**
 * @description Inline variable where parentheses are needed for precedence
 * @command refakts inline-variable "[{{CURRENT_FILE}} 8:10-8:11]"
 */

function calc(a: number): number {
  const x = a + 2;
  return x * 10;
}

