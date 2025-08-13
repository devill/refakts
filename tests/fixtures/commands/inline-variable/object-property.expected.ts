/**
 * @description Inline variable containing object property access
 * @command refakts inline-variable "[{{CURRENT_FILE}} 8:10-8:15]"
 */

function getFullName(person: { firstName: string; lastName: string }): string {
  return person.firstName + " " + person.lastName;
}