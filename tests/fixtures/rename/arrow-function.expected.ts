/**
 * @description Rename parameter in arrow function  
 * @command refakts rename arrow-function.input.ts --query "ArrowFunction Parameter Identifier[name='x']" --to "value"
 */

const transform = (value: number) => {
  const doubled = value * 2;
  return doubled + value;
};

const filter = (value: string) => value.length > 0; // Different 'x' - should not be renamed