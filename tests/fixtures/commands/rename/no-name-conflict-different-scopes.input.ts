/**
 * @description Test valid rename where name exists in different unrelated scope
 * @command refakts rename "[no-name-conflict-different-scopes.input.ts 10:11-10:12]" --to "y"
 */
function f() {
    const y = 1; // This y should not conflict with the x we're renaming
}

function g() {
    const x = 2; // This should be renamed to y
    return x;
}