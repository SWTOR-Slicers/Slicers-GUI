const path = require('path');
const fs = require('fs');
const devBuild = false;

const res = fs.readFileSync(path.normalize((devBuild) ? path.join(process.resourcesPath, 'resources.json') : path.join(__dirname, '../../resources/', 'resources.json')));
const resJson = JSON.parse(res);

let resourcePath = resJson['resourceDirPath'];

export function updateResourcePath(path) {
    resourcePath = path;
}

export {resourcePath};