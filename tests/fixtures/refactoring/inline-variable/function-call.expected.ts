/**
 * @description Inline variable containing function call
 * @command refakts inline-variable function-call.input.ts --query "Identifier[name='trimmed']"
 */

function processString(text: string): string {
  return text.trim().toUpperCase();
}