/**
 * @description Test rename x to y where y already exists in inner scope
 * @command refakts rename "[name-conflict-x-to-y.input.ts 7:11-7:12]" --to "y"
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