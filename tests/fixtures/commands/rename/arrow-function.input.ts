/**
 * @description Rename parameter in arrow function  
 * @command refakts rename "[{{CURRENT_FILE}} 6:20-6:21]" --to "value"
 */

const transform = (x: number) => {
  const doubled = x * 2;
  return doubled + x;
};

const filter = (x: string) => x.length > 0; // Different 'x' - should not be renamed