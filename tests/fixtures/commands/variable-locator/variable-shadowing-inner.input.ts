/**
 * @description Find inner variable that shadows outer variable
 * @command variable-locator "[variable-shadowing-inner.input.ts 11:9-11:14]"
 */

function innerShadowing() {
  let value = 10; // This is outer value
  console.log(value); // Should NOT find this usage (belongs to outer value)
  
  if (true) {
    let value = 20; // Target this declaration
    console.log(value); // Should find this usage
    value = 30; // Should find this usage
  }
  
  console.log(value); // Should NOT find this usage (back to outer scope)
}