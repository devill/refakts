/**
 * @description Inline variable containing function call
 * @command refakts inline-variable "[{{CURRENT_FILE}} 8:10-8:17]"
 */

function processString(text: string): string {
  const trimmed = text.trim();
  return trimmed.toUpperCase();
}