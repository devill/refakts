/**
 * @description Select variable with line preview but precise selection
 * @command refakts select preview-line.input.ts --regex "tempResult" --preview-line
 */

function processData() {
    const input = getData();
    const tempResult = transform(input);
    const output = validate(tempResult);
    return output;
}