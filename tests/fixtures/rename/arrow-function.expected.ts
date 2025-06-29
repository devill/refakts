/**
 * @skip
 * @description Rename parameter in arrow function  
 * @command refakts rename arrow-function.input.ts --query "ArrowFunction Parameter Identifier[name='x']" --to "value"
 */

const transform = (value: number) => {
  const doubled = value * 2;
  return doubled + value;
};

const filter = (x: string) => x.length > 0; // Different 'x' - should not be renamed