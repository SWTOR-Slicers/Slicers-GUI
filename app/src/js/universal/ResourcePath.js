const path = require('path');
const fs = require('fs');
//for production use process.resourcesPath
const res = fs.readFileSync(path.normalize(path.join(__dirname, '../../resources/', 'resources.json')));
const resJson = JSON.parse(res);

let resourcePath = resJson['resourceDirPath'];

export function updateResourcePath(path) {
    resourcePath = path;
}

export {resourcePath};