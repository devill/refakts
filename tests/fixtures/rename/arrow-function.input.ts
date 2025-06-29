/**
 * @description Rename parameter in arrow function  
 * @command refakts rename arrow-function.input.ts --query "ArrowFunction Parameter Identifier[name='x']" --to "value"
 */

const transform = (x: number) => {
  const doubled = x * 2;
  return doubled + x;
};

const filter = (x: string) => x.length > 0; // Different 'x' - should not be renamed