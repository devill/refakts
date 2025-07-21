/**
 * @description Test case where regex pattern finds no matches
 * @command refakts select no-regex-matches.input.ts --regex "nonExistentPattern"
 */

function calculateSomething() {
    const width = 10;
    const height = 20;
    const area = width * height;
    return area;
}