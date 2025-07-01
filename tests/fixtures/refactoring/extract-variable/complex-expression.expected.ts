/**
 * @description Extract a complex expression with method calls
 * @command refakts extract-variable complex-expression.input.ts --query "CallExpression:has(PropertyAccessExpression:has(Identifier[name='toUpperCase']))" --name "upperName" --all
 */

function processUser(user: { name: string }) {
    const upperName = user.name.toUpperCase();
  if (upperName === 'ADMIN') {
    console.log('Admin user detected');
  }
  return upperName;
}