/**
 * @description Test multiple regex patterns in single command
 * @command refakts select multiple-regex-patterns.input.ts --regex "width" --regex "height"
 */

function calculateArea() {
    const width = 10;
    const height = 20;
    const area = width * height;
    const perimeter = 2 * (width + height);
    return { area, perimeter };
}