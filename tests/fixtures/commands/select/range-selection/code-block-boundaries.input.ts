/**
 * @description Select with intelligent boundaries respecting code blocks
 * @command refakts select code-block-boundaries.input.ts --regex "user.*" --boundaries "function"
 */

function getUserData() {
    const userInfo = fetchUser();
    const userPrefs = loadPreferences();
    return { userInfo, userPrefs };
}

function processUserAction(action: string) {
    const userData = getUserData();
    const result = executeAction(action, userData);
    return result;
}

const userConstants = {
    MAX_USERS: 100,
    USER_ROLES: ['admin', 'user']
};