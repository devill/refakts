/**
 * @description Test rename conflict in nested functions with arrow functions
 * @command refakts rename "[name-conflict-nested-functions.input.ts 7:11-7:12]" --to "result"
 * @expect-error true
 */
function processData(data: number[]) {
    const x = 10;
    
    const processor = () => {
        const result = x * 2;
        return result;
    };
    
    return processor();
}