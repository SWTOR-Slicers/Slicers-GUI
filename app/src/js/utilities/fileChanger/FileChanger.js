import { FileEntry } from "./FileEntry.js";
//DOM variables

//version radio selection
const live = document.getElementById('live');
const pts = document.getElementById('pts');

//assets folder variables
const assetsFolderInput = document.getElementById('assetsFolderInput');
const assetsFolderBrowseBtn = document.getElementById('assetsFolderBrowseBtn');

//backup checkbox
const createBackup = document.getElementById('createBackup');

//preset variables
const loadPre = document.getElementById('loadPre');
const writPre = document.getElementById('writPre');

const loadedPresetPath = document.getElementById('loadedPresetPath');

const convPre = document.getElementById('convPre');

//action variables
const restoreBackup = document.getElementById('restoreBackup');
const extrFile = document.getElementById('extrFile');
const extrNode = document.getElementById('extrNode');

const chngFiles = document.getElementById('chngFiles');

//file changes variables
const fileChangesCont = document.getElementById('fileChangesCont');

//progress bar
const progBar = document.getElementById('progBar');

//change variables
const addChange = document.getElementById('addChange');

function init() {
    const test = new FileEntry('File', 'Temp', 'Temp2').render();
    fileChangesCont.appendChild(test);
}

function verifyEntry(ent) {
    
}

init();