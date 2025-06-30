/**
 * @skip
 * @description Rename variable in nested scopes with multiple usages
 * @command refakts rename nested-scopes.input.ts --query "FunctionDeclaration[name='processItems'] Parameter Identifier[name='items']" --to "itemList"
 */

function processItems(itemList: string[]): string[] {
  const result = itemList.map(item => {
    const items = item.split(','); // Different 'items' variable in inner scope - should remain unchanged
    return items.join('|');
  });
  
  if (itemList.length > 0) {
    console.log(`Processing ${itemList.length} items`);
  }
  
  return result.concat(itemList);
}