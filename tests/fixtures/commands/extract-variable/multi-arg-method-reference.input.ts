/**
 * @description Extract a multi-argument method reference (without call)
 * @command refakts extract-variable "[multi-arg-method-reference.input.ts 7:9-7:28]" --name "substringMethod" --all
 */

function processUser(user: { name: string }) {
    if (user.name.substring(0, 5) === 'ADMIN') {
        console.log('Admin user detected');
    }
    return user.name.substring(0, 5);
}