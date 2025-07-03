/**
 * @description Select variable
 * @command refakts select narrow-down-with-capture-group.input.ts --regex "(tempResult).*input"
 */

function processData() {
    const input = getData();
    const tempResult = transform(input);
    const output = validate(tempResult);
    return output;
}