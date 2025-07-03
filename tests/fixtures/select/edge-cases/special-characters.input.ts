/**
 * @description Test selection with special characters in regex
 * @command refakts select special-characters.input.ts --regex "\\$\\{.*\\}"
 * @skip
 */

function processTemplate() {
    const template = "Hello ${name}, welcome to ${location}!";
    const result = template.replace(/\$\{(\w+)\}/g, (match, key) => {
        return data[key] || match;
    });
    return result;
}