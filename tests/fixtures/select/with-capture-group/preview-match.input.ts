/**
 * @description Select variable and preview matching context
 * @command refakts select narrow-down-with-capture-group.input.ts --regex "(tempResult).*input" --preview-match
 * @skip
 */

function processData() {
    const input = getData();
    const tempResult = transform(input);
    const output = validate(tempResult);
    return output;
}