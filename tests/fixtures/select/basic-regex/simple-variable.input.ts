/**
 * @description Select simple variable declaration by name
 * @command refakts select simple-variable.input.ts --regex "tempResult"
 * @skip
 */

function calculateSomething() {
    const width = 10;
    const height = 20;
    const tempResult = width * height;
    console.log(tempResult);
    return tempResult + 5;
}