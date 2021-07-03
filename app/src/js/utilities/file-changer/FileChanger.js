import { resourcePath } from "../../../api/config/resource-path/ResourcePath.js";
import { getSetting } from "../../../api/config/settings/Settings.js";
import { log, updateAlertType } from "../../universal/Logger.js";
import { addTooltip, removeTooltip, updateTooltipEvent } from "../../universal/Tooltips.js";
import { FileEntry } from "./FileEntry.js";
import * as MOD from "./Mod.js";

//consts
const { ipcRenderer } = require("electron");
const fs = require('fs');
const path = require('path');
const validFilename = require('valid-filename');
const configPath = path.normalize(path.join(resourcePath, "config.json"));
/**
 * Array of mod entries
 * @type {FileEntry[]}
 */
const fileChanges = [];
const functionalList = [];
const chngEvn = new Event('change');
const cache = {
    "assets": "",
    "output": "",
    "backup": true,
    "version": "Live"
}

//globals
let settingsJSON = getSetting();

//DOM variables

//save modal
const saveModal = document.getElementById('saveModal');
const nameInput = document.getElementById('nameInput');
const confirmSave = document.getElementById('confirmSave');
const cancelSave = document.getElementById('cancelSave');

//error modal
const errModal = document.getElementById('errModal');
const infoDisp = document.getElementById('infoDisp');
const contCreate = document.getElementById('contCreate');
const cancelCreate = document.getElementById('cancelCreate');

//version radio selection
const live = document.getElementById('live');
const pts = document.getElementById('pts');

//assets folder variables
const assetsFolderInput = document.getElementById('assetsFolderInput');
const assetsFolderBrowseBtn = document.getElementById('assetsFolderBrowseBtn');

//output folder variables
const outputFolderLabel = document.getElementById('outputFolderLabel');
const outputFolderInput = document.getElementById('outputFolderInput');
const outputFolderBrowseBtn = document.getElementById('outputFolderBrowseBtn');

//backup checkbox
const createBackup = document.getElementById('createBackup');

//Mod variables
const loadMod = document.getElementById('loadMod');
const writeMod = document.getElementById('writeMod');

const loadedModPath = document.getElementById('loadedModPath');

const convMod = document.getElementById('convMod');

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


async function loadCache() {
    let res = fs.readFileSync(configPath);
    let jsonObj = await JSON.parse(res);
    let json = jsonObj["fileChanger"];

    cache['backup'] = json['backup'];
    createBackup.checked = cache['backup'];

    cache['version'] = json['version'];
    if (cache['version'] == 'pts') {
        live.checked = false;
        pts.checked = true;
    }

    if (json["output"] == "") {
        const defaultPath = path.join(jsonObj["outputFolder"], 'changer');
        if (!fs.existsSync(defaultPath)) {
            fs.mkdirSync(defaultPath);
        }
        updateCache('output', defaultPath);
        cache["output"] = defaultPath
    } else {
        cache["output"] = json["output"];
    }

    if (json["assets"] == "") {
        const defaultPath = jsonObj["assetsFolder"];
        updateCache('output', defaultPath);
        cache["assets"] = defaultPath
    } else {
        cache["assets"] = json["assets"];
    }
}
function updateCache(field, val) {
    const shouldUpdate = (field == "assetsFolder") ? fs.existsSync(val) : true; 
    if (shouldUpdate) {
        let res = fs.readFileSync(configPath);
        let json = JSON.parse(res);
        if (json["fileChanger"][field] != val) {
            json["fileChanger"][field] = val;
            cache[field] = val;
        
            fs.writeFileSync(configPath, JSON.stringify(json, null, '\t'), 'utf-8');
        }

        if (field == "assetsFolder") {
            assetsFolderInput.dispatchEvent(updateTooltipEvent);
        }
    } else {
        assetsFolderInput.value = cache["output"];
    }
}
function setupFolders() {
    const folders = ['backups', 'mods', 'presets'];

    for (const folder of folders) {
        const fPath = path.join(cache['output'], folder);
        if (!fs.existsSync(fPath)) {
            fs.mkdirSync(fPath);
        }
    }
}
function initTooltips() {
    addTooltip('top', nameInput, false, (element) => { return 'Name of your mod'; });

    if (settingsJSON.usePathTooltips) {
        addTooltip('top', assetsFolderInput, true, (element) => { return element.value; });
        addTooltip('top', outputFolderInput, true, (element) => { return element.value; });
    }

    if (settingsJSON.useLabelTooltips) {
        addTooltip('top', outputFolderLabel, false, (element) => { return 'FileChanger output folder'; });
    }
}

async function init() {
    await loadCache();
    setupFolders();
    initListeners();
    initSubs();
    initTooltips();
}

function initListeners() {
    //config fields
    assetsFolderInput.addEventListener('change', (e) => {
        if (fs.existsSync(e.currentTarget.value)) {
            log('FileChanger assets field successfully set', 'info');
            updateCache('assets', e.currentTarget.value);
            e.currentTarget.dispatchEvent(updateTooltipEvent);
        } else {
            log('Invalid path for fileChanger assets field.', 'alert');
            e.currentTarget.value = cache['assets'];
        }
    });
    assetsFolderBrowseBtn.addEventListener('click', (e) => { ipcRenderer.send('openFolderDialogChanger', assetsFolderInput.id); });
    outputFolderInput.addEventListener('change', (e) => {
        if (fs.existsSync(e.currentTarget.value)) {
            log('FileChanger output field successfully set', 'info');
            updateCache('output', e.currentTarget.value);
            e.currentTarget.dispatchEvent(updateTooltipEvent);
        } else {
            log('Invalid path for fileChanger output field.', 'alert');
            e.currentTarget.value = cache['output'];
        }
    });
    outputFolderBrowseBtn.addEventListener('click', (e) => { ipcRenderer.send('openFolderDialogChanger', outputFolderInput.id); });
    createBackup.addEventListener('change', (e) => { updateCache('backup', e.currentTarget.checked); });
    live.addEventListener('change', (e) => { updateCache('version', (e.currentTarget.checked) ? 'live' : 'pts'); });
    //change functionality
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
            const newChng = new FileEntry('File', '', '', fileChanges, writeMod);

            fileChanges.push(newChng);

            const newChngElem = newChng.render();
            fileChangesCont.appendChild(newChngElem);

            newChng.dropDown.clickCallback = (e) => { newChng.type = e.currentTarget.innerHTML; }

            writeMod.classList.remove('disabled')
        }
    });
    //mod preset functionality
    writeMod.addEventListener('click', (e) => { saveModal.style.display = ''; });
    //save modal functionality
    nameInput.addEventListener('change', (e) => {
        const val = e.currentTarget.value;
        if (val == '' || val == ' ' || (!validFilename(val))) {
            confirmSave.classList.add('disabled');
        } else {
            confirmSave.classList.remove('disabled');
        }
    });
    confirmSave.addEventListener('click', (e) => {
        const errList = [];
        for (let i = 0; i < fileChanges.length; i++) {
            const change = fileChanges[i];
            const status = change.verify();
            if (status == 200) {
                functionalList.push(change);
            } else {
                errList.push(i);
            }
        }

        if (functionalList.length > 0 && errList.length == 0) {
            const success = MOD.write(nameInput.value, functionalList);
            if (success == 200) { log('Mod created sucessfully!', 'info'); } else { log('Something went wrong when creating the mod.', 'alert'); }
            functionalList = [];
        } else if (errList.length > 0) {
            infoDisp.innerHTML = errList.join(', ');
            errModal.style.display = '';
        }
        saveModal.style.display = 'none';
        confirmSave.classList.add('disabled');
        nameInput.value = '';
    });
    cancelSave.addEventListener('click', (e) => {
        saveModal.style.display = 'none';
        confirmSave.classList.add('disabled');
        nameInput.value = '';
    });
    //err modal functionality
    contCreate.addEventListener('click', (e) => {
        const success = MOD.write(nameInput.value, functionalList);
        if (success == 200) { log('Incomplet mod created sucessfully!', 'info'); } else { log('Something went wrong when creating the incomplete mod.', 'alert'); }
        functionalList = [];
        errModal.style.display = 'none';
        infoDisp.innerHTML = '';
    });
    cancelCreate.addEventListener('click', (e) => {
        errModal.style.display = 'none';
        infoDisp.innerHTML = '';
    });
}

function initSubs() {
    ipcRenderer.on('updateSettings', (event, data) => {
        settingsJSON = data[1];
        for (const dEnt of data[0]) {
            if (!Array.isArray(dEnt)) {
                switch (dEnt) {
                    case "alerts":
                        alertType = settingsJSON.alerts;
                        updateAlertType(settingsJSON.alerts);
                        break;
                    case "usePathTooltips":
                        if (settingsJSON.usePathTooltips) {
                            addTooltip('top', assetsFolderInput, true, (element) => { return element.value; });
                            addTooltip('top', outputFolderInput, true, (element) => { return element.value; });
                        } else {
                            removeTooltip(assetsFolderInput, true, (element) => { return element.value; });
                            removeTooltip(outputFolderInput, true, (element) => { return element.value; });
                        }
                        break;
                    case "useLabelTooltips":
                        if (settingsJSON.useLabelTooltips) {
                            addTooltip('top', outputFolderLabel, false, (element) => { return 'FileChanger output folder'; });
                        } else {
                            removeTooltip(outputFolderLabel, false, (element) => { return 'FileChanger output folder'; });
                        }
                        break;
                }
            }
        }
    });
    ipcRenderer.on('changerDialogResponse', (event, data) => {
        if (data != "") {
            const id = data[0];
            const fPath = data[1][0];

            const mInput = document.getElementById(`${id}-ModdedInput`);
            mInput.value = fPath;
            mInput.dispatchEvent(chngEvn);
        }
    });
    ipcRenderer.on('changerFolderDialogResponse', (event, data) => {
        if (data != '') {
            const elem = document.getElementById(data[0]);
            elem.value = data[1];
            elem.dispatchEvent(chngEvn);
        }
    });
}

init();