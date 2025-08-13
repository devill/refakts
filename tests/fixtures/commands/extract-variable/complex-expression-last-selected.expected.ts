/**
 * @description Extract all occurrences when last occurrence is selected
 * @command refakts extract-variable "[{{CURRENT_FILE}} 10:12-10:35]" --name "upperName" --all
 */

function processUser(user: { name: string }) {
    const upperName = user.name.toUpperCase();
    if (upperName === 'ADMIN') {
        console.log('Admin user detected');
    }
    return upperName;
}