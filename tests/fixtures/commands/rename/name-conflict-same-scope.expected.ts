/**
 * @description Test rename to variable name that exists in same scope
 * @command refakts rename "[name-conflict-same-scope.input.ts 7:11-7:12]" --to "y"
 * @expect-error true
 */
function f() {
    const x = 1;
    const y = 2;
    return x + y;
}