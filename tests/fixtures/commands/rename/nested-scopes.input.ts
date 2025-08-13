/**
 * @description Rename variable in nested scopes with multiple usages
 * @command refakts rename "[{{CURRENT_FILE}} 6:23-6:28]" --to "itemList"
 */

function processItems(items: string[]): string[] {
  const result = items.map(item => {
    const items = item.split(','); // Different 'items' variable in inner scope
    return items.join('|');
  });
  
  if (items.length > 0) {
    console.log(`Processing ${items.length} items`);
  }
  
  return result.concat(items);
}