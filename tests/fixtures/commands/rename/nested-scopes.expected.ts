/**
 * @description Rename variable in nested scopes with multiple usages
 * @command refakts rename "[{{CURRENT_FILE}} 6:23-6:28]" --to "itemList"
 */

function processItems(itemList: string[]): string[] {
  const result = itemList.map(item => {
    const items = item.split(','); // Different 'items' variable in inner scope
    return items.join('|');
  });
  
  if (itemList.length > 0) {
    console.log(`Processing ${itemList.length} items`);
  }
  
  return result.concat(itemList);
}