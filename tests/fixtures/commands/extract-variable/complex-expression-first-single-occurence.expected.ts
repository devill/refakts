/**
 * @description Extract first occurrence of a complex expression with method calls
 * @command refakts extract-variable "[complex-expression-first-single-occurence.input.ts 7:9-7:32]" --name "upperName"
 */

function processUser(user: { name: string }) {
    const upperName = user.name.toUpperCase();
    if (upperName === 'ADMIN') {
    console.log('Admin user detected');
  }
  return user.name.toUpperCase();
}