/**
 * @description Select expressions matching a pattern
 * @command refakts select expression-pattern.input.ts --regex "width.*height"
 * @skip
 */

function calculateSomething() {
    const width = 10;
    const height = 20;
    const area = width * height;
    const perimeter = width + height;
    const diagonal = Math.sqrt(width * width + height * height);
    return { area, perimeter, diagonal };
}