/**
 * @description Test rename with parent scope conflict
 * @command refakts rename "[{{CURRENT_FILE}} 7:11-7:12]" --to "y"
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