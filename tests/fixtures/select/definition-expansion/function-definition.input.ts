/**
 * @description Select function with full definition context
 * @command refakts select function-definition.input.ts --regex "calculateTotal" --include-definition
 * @skip
 */

function helper() {
    return 42;
}

function calculateTotal(a: number, b: number): number {
    const result = a + b;
    return result;
}

function main() {
    return calculateTotal(10, 20);
}