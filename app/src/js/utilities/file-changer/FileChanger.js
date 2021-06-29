const { ipcRenderer } = require("electron");
import { log } from "../../universal/Logger.js";
import { FileEntry } from "./FileEntry.js";

//consts
const fileChanges = [];

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
    initListeners();
    initSubs();
}

function initListeners() {
    addChange.addEventListener('click', (e) => {
        let shouldAdd = true
        if (fileChanges.length > 0) {
            const lastChld = fileChanges[fileChanges.length - 1];
            if (lastChld.target == '' || lastChld.modded == '') {
                shouldAdd = false;
                log('You need to fill out the previous file change element.', 'alert');
            }
        }

        if (shouldAdd) {
            const newChng = new FileEntry('File', '', '', fileChanges);
            newChng.dropDown.clickCallback = (e) => { newChng.type = e.currentTarget.innerHTML; }

            fileChanges.push(newChng);

            const newChngElem = newChng.render();
            fileChangesCont.appendChild(newChngElem);
        }
    })
}

function initSubs() {
    ipcRenderer.on('changerDialogResponse', (event, data) => {
        if (data != "") {
            const id = data[0];
            const fPath = data[1][0];

            
        }
    });
}

function verifyEntry(ent) {
    
}

init();