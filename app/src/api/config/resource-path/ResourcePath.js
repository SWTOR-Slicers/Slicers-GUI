const {ipcRenderer} = require('electron');
const isPackaged = ipcRenderer.sendSync('isPackaged');
const path = require('path');
const fs = require('fs');

const res = fs.readFileSync(path.normalize((!isPackaged) ? path.join(__dirname, '../../resources/', 'resources.json') : path.join(process.resourcesPath, 'resources.json')));
const sourcePath = path.normalize((!isPackaged) ? path.join(__dirname, '../') : path.join(process.resourcesPath, 'app', 'src'));
const resJson = JSON.parse(res);

let resourcePath = resJson['resourceDirPath'];

/**
 * Updates the resources path
 * @param  {String} path The new resource path
 */
export function updateResourcePath(path) {
    resourcePath = path;
}

export {resourcePath, sourcePath};