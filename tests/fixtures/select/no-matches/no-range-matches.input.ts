/**
 * @description Test case where range selection finds no matches
 * @command refakts select no-range-matches.input.ts --range --start-regex "nonExistentStart" --end-regex "nonExistentEnd"
 */

function simpleFunction() {
    const value = 42;
    return value;
}