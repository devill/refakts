/**
 * @description Extract first occurrence of a complex expression with method calls
 * @command refakts extract-variable "[{{CURRENT_FILE}} 7:9-7:32]" --name "upperName"
 */

function processUser(user: { name: string }) {
    const upperName = user.name.toUpperCase();
    if (upperName === 'ADMIN') {
    console.log('Admin user detected');
  }
  return user.name.toUpperCase();
}