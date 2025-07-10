/**
 * @description Extract all occurrences when last occurrence is selected
 * @command refakts extract-variable "[complex-expression-last-selected.input.ts 10:12-10:35]" --name "upperName" --all
 */

function processUser(user: { name: string }) {
    if (user.name.toUpperCase() === 'ADMIN') {
        console.log('Admin user detected');
    }
    return user.name.toUpperCase();
}