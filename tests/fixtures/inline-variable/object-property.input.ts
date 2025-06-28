/**
 * @description Inline variable containing object property access
 * @command refakts inline-variable object-property.input.ts --query "Identifier[name='first']"
 * @skip
 */

function getFullName(person: { firstName: string; lastName: string }): string {
  const first = person.firstName;
  return first + " " + person.lastName;
}