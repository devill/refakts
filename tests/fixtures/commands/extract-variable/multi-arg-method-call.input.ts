/**
 * @description Extract a multi-argument method call
 * @command refakts extract-variable "[multi-arg-method-call.input.ts 7:9-7:34]" --name "formattedName" --all
 */

function processUser(user: { name: string }) {
    if (user.name.substring(0, 5) === 'ADMIN') {
        console.log('Admin user detected');
    }
    return user.name.substring(0, 5);
}