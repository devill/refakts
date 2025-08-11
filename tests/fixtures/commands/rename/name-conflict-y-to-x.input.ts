/**
 * @description Test rename y to x where x already exists in outer scope
 * @command refakts rename "[name-conflict-y-to-x.input.ts 9:15-9:16]" --to "x"
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