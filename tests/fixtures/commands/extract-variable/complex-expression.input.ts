/**
 * @description Extract a complex expression with method calls
 * @command refakts extract-variable "[{{CURRENT_FILE}} 7:9-7:32]" --name "upperName" --all
 */

function processUser(user: { name: string }) {
    if (user.name.toUpperCase() === 'ADMIN') {
    console.log('Admin user detected');
  }
  return user.name.toUpperCase();
}