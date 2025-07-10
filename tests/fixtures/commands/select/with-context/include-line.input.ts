/**
 * @description Select variable with full line context
 * @command refakts select include-line.input.ts --regex "tempResult" --include-line
 */

function processData() {
    const input = getData();
    const tempResult = transform(input);
    const output = validate(tempResult);
    return output;
}