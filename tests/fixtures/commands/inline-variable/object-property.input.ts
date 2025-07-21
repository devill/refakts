/**
 * @description Inline variable containing object property access
 * @command refakts inline-variable "[object-property.input.ts 8:10-8:15]"
 */

function getFullName(person: { firstName: string; lastName: string }): string {
  const first = person.firstName;
  return first + " " + person.lastName;
}