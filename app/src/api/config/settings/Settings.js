const path = require('path');
const fs = require('fs');

const devBuild = true;

const res = fs.readFileSync(path.normalize((devBuild) ? path.join(__dirname, '../../resources/', 'appSettings.json') : path.join(process.resourcesPath, 'appSettings.json')));
const resJson = JSON.parse(res);

let settingsJSON = resJson;

export function updateSettings(settingsJson) {
    //TODO: update the appSettings.json file with new values
    resourcePath = path;
}

export {settingsJSON};