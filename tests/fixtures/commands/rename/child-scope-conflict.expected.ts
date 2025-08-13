/**
 * @description Test rename with child scope conflict - renaming y to x should fail
 * @command refakts rename "[{{CURRENT_FILE}} 9:15-9:16]" --to "x"
 * @expect-error true
 */
function f() {
    const x = 1;
    {
        const y = 2;
        {
            return x;
        }
    }
}