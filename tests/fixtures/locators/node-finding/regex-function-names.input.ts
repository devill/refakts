/**
 * @description Find functions with names containing 'calculate' using regex
 * @command node-finding regex-function-names.input.ts --regex "function calculate\w+"
 */

function calculateArea(width: number, height: number): number {
  const area = width * height;
  return area;
}

function calculatePerimeter(width: number, height: number): number {
  return 2 * (width + height);
}

function processData(data: any): void {
  // This should not match
  console.log(data);
}

function calculateVolume(length: number, width: number, height: number): number {
  return length * width * height;
}