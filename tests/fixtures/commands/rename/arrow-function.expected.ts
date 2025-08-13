/**
 * @description Rename parameter in arrow function  
 * @command refakts rename "[{{CURRENT_FILE}} 6:20-6:21]" --to "value"
 */

const transform = (value: number) => {
  const doubled = value * 2;
  return doubled + value;
};

const filter = (x: string) => x.length > 0; // Different 'x' - should not be renamed