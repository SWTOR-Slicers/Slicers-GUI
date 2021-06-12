const path = require('path');
const fs = require('fs');
const devBuild = false;

const res = fs.readFileSync(path.normalize((devBuild) ? path.join(__dirname, '../../resources/', 'resources.json') : path.join(process.resourcesPath, 'resources.json')));
const resJson = JSON.parse(res);

let resourcePath = resJson['resourceDirPath'];

export function updateResourcePath(path) {
    resourcePath = path;
}

export {resourcePath};