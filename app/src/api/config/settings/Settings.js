const path = require('path');
const fs = require('fs');

const devBuild = true;

const settingsJsonPath = path.normalize((devBuild) ? path.join(__dirname, '../../resources/', 'appSettings.json') : path.join(process.resourcesPath, 'appSettings.json'));
const res = fs.readFileSync(settingsJsonPath);
const resJson = JSON.parse(res);

let settingsJSON = resJson;

function updateSettings(settingsJson) {
    settingsJSON = settingsJson;
    fs.writeFileSync(settingsJsonPath, settingsJSON);
}

export { settingsJSON, updateSettings };