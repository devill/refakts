/**
 * @description Extract a variable holding just the function, not the return value
 * @command refakts extract-variable "[extract-variable-holding-function.input.ts 7:9-7:30]" --name "toUpperCase" --all
 */

function processUser(user: { name: string }) {
    const toUpperCase = user.name.toUpperCase;
    if (toUpperCase() === 'ADMIN') {
        console.log('Admin user detected');
    }
    return toUpperCase();
}