function transform(input: string): string {
  return input.toUpperCase();
}

function validate(input: string): boolean {
  return input.length > 0;
}

const tempResult = transform("input");
const output = validate(tempResult);