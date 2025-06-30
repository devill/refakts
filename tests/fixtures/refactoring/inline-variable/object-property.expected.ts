/**
 * @description Inline variable containing object property access
 * @command refakts inline-variable object-property.input.ts --query "Identifier[name='first']"
 */

function getFullName(person: { firstName: string; lastName: string }): string {
  return person.firstName + " " + person.lastName;
}