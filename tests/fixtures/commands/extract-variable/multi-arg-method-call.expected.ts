/**
 * @description Extract a multi-argument method call
 * @command refakts extract-variable "[{{CURRENT_FILE}} 7:9-7:34]" --name "formattedName" --all
 */

function processUser(user: { name: string }) {
    const formattedName = user.name.substring(0, 5);
    if (formattedName === 'ADMIN') {
        console.log('Admin user detected');
    }
    return formattedName;
}