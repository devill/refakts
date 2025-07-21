/**
 * @description Select range with begin and end regex patterns
 * @command refakts select begin-end-regex.input.ts --range --start-regex "const.*=" --end-regex "return.*"
 */

function processData() {
    const input = getData();
    const processed = transform(input);
    const validated = validate(processed);
    return validated;
}

function calculateTotal(items: number[]) {
    const sum = items.reduce((acc, item) => acc + item, 0);
    const tax = sum * 0.1;
    const total = sum + tax;
    return total;
}