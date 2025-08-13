/**
 * @description Extract a multi-argument method reference (without call)
 * @command refakts extract-variable "[{{CURRENT_FILE}} 7:9-7:28]" --name "substringMethod" --all
 */

function processUser(user: { name: string }) {
    const substringMethod = user.name.substring;
    if (substringMethod(0, 5) === 'ADMIN') {
        console.log('Admin user detected');
    }
    return substringMethod(0, 5);
}