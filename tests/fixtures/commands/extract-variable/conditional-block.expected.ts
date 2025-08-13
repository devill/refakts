/**
 * @description Extract variable from inside conditional block
 * @command refakts extract-variable "[{{CURRENT_FILE}} 7:7-7:15]" --name "userAge"
 */

function checkAge(user: { age: number }) {
    const userAge = user.age;
  if (userAge >= 18) {
    console.log('Adult user');
    return true;
  }
  return false;
}