/**
 * @description Extract a complex expression with method calls
 * @command refakts extract-variable "[complex-expression.input.ts 7:7-7:30]" --name "upperName" --all
 */

function processUser(user: { name: string }) {
    const upperName = user.name.toUpperCase();
  if (upperName === 'ADMIN') {
    console.log('Admin user detected');
  }
  return upperName;
}