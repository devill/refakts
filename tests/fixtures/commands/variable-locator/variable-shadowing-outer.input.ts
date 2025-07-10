/**
 * @description Find outer variable when shadowed by inner variable
 * @command variable-locator "[variable-shadowing-outer.input.ts 7:7-7:12]"
 */

function outerShadowing() {
  let value = 10; // Target this declaration
  console.log(value); // Should find this usage
  
  if (true) {
    let value = 20; // This shadows the outer value
    console.log(value); // Should NOT find this usage (belongs to inner value)
  }
  
  console.log(value); // Should find this usage (back to outer scope)
}