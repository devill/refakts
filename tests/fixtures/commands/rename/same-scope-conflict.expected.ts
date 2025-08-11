/**
 * @description Test rename with same scope conflict
 * @command refakts rename "[same-scope-conflict.input.ts 7:11-7:12]" --to "y"
 * @expect-error true
 */
function f() {
    const x = 1;
    const y = 2;
    return x + y;
}