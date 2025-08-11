/**
 * @description Test rename local variable to parameter name
 * @command refakts rename "[name-conflict-parameter.input.ts 7:11-7:12]" --to "param"
 * @expect-error true
 */
function f(param: number) {
    const x = 1;
    return x + param;
}