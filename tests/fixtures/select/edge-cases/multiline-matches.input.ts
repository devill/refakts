/**
 * @description Test selection spanning multiple lines
 * @command refakts select multiline-matches.input.ts --regex "function.*\\{[\\s\\S]*?\\}"
 * @skip
 */

function simple() {
    return 42;
}

function complex() {
    const value = calculate();
    const result = process(value);
    return result;
}

const arrow = () => {
    return "arrow";
};