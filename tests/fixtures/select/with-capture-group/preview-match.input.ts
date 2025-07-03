/**
 * @description Select variable and preview matching context
 * @command refakts select preview-match.input.ts --regex "(tempResult).*input" --preview-match
 */

function processData() {
    const input = getData();
    const tempResult = transform(input);
    const output = validate(tempResult);
    return output;
}