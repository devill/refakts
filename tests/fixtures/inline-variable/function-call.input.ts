/**
 * @description Inline variable containing function call
 * @command refakts inline-variable function-call.input.ts --query "Identifier[name='trimmed']"
 * @skip
 */

function processString(text: string): string {
  const trimmed = text.trim();
  return trimmed.toUpperCase();
}