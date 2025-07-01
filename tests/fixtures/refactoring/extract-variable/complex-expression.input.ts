/**
 * @description Extract a complex expression with method calls
 * @command refakts extract-variable complex-expression.input.ts --query "CallExpression:has(PropertyAccessExpression:has(Identifier[name='toUpperCase']))" --name "upperName" --all
 */

function processUser(user: { name: string }) {
  if (user.name.toUpperCase() === 'ADMIN') {
    console.log('Admin user detected');
  }
  return user.name.toUpperCase();
}