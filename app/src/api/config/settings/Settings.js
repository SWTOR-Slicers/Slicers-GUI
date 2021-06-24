const path = require('path');
const fs = require('fs');

const devBuild = true;

const settingsJsonPath = path.normalize((devBuild) ? path.join(__dirname, '../../resources/', 'appSettings.json') : path.join(process.resourcesPath, 'appSettings.json'));
const res = fs.readFileSync(settingsJsonPath);
const resJson = JSON.parse(res);

let settingsJSON = resJson;

/**
 * Returns the settings json
 */
function getSetting() {
    return settingsJSON;
}
/**
 * Updates the settings json file
 * @param  {Object} settingsJson The updated settings object
 */
async function updateSettings(settingsJson) {
    settingsJSON = settingsJson;
    fs.writeFileSync(settingsJsonPath, JSON.stringify(settingsJSON, null, '\t'));
}

export { getSetting, updateSettings };