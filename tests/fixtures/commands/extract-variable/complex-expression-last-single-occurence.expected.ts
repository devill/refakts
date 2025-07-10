/**
 * @description Extract last occurrence of a complex expression with method calls
 * @command refakts extract-variable "[complex-expression-last-single-occurence.input.ts 10:12-10:35]" --name "upperName"
 */

function processUser(user: { name: string }) {
    if (user.name.toUpperCase() === 'ADMIN') {
        console.log('Admin user detected');
    }
    const upperName = user.name.toUpperCase();
    return upperName;
}