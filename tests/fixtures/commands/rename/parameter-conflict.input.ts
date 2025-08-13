/**
 * @description Test rename with parameter conflict
 * @command refakts rename "[{{CURRENT_FILE}} 7:11-7:12]" --to "param"
 * @expect-error true
 */
function f(param: number) {
    const x = 1;
    return x + param;
}