import { resourcePath } from "../../../api/config/resource-path/ResourcePath.js";
import { getSetting } from "../../../api/config/settings/Settings.js";
import { HashDictionary } from "../../classes/hash/HashDictionary.js";
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
const chngEvn = new Event('change');
const cache = {
    "assets": "",
    "output": "",
    "backup": true,
    "version": "Live"
}
const hashDict = new HashDictionary('hash/hashes_filename.txt');


//globals
let settingsJSON = getSetting();
let functionalList = [];

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

//extr modal
const extrModal = document.getElementById('extrModal');
const extrInput = document.getElementById('extrInput');
const startExtr = document.getElementById('startExtr');
const cancelExtr = document.getElementById('cancelExtr');

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
const moddedParentFolder = document.getElementById('moddedParentFolder');
const moddedParentFolderBrowseBtn = document.getElementById('moddedParentFolderBrowseBtn');

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

    if (json["output"] == "" || !fs.existsSync(json["output"])) {
        const defaultPath = path.join(jsonObj["outputFolder"], 'changer');
        if (!fs.existsSync(defaultPath)) {
            fs.mkdirSync(defaultPath);
        }
        updateCache('output', defaultPath);
        cache["output"] = defaultPath;
    } else {
        cache["output"] = json["output"];
    }
    outputFolderInput.value = cache['output'];
    outputFolderInput.dispatchEvent(updateTooltipEvent);

    if (json["assets"] == "" || !fs.existsSync(json["assets"])) {
        const defaultPath = jsonObj["assetsFolder"];
        updateCache('output', defaultPath);
        cache["assets"] = defaultPath
    } else {
        cache["assets"] = json["assets"];
    }
    assetsFolderInput.value = cache['assets'];
    assetsFolderInput.dispatchEvent(updateTooltipEvent);
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
    addTooltip('top', extrInput, true, (element) => { return element.getAttribute('data-tooltip'); });

    if (settingsJSON.usePathTooltips) {
        addTooltip('top', assetsFolderInput, true, (element) => { return element.value; });
        assetsFolderInput.parentElement.style.flexGrow = 1;
        assetsFolderInput.style.width = `calc(100% - 14px)`;
        addTooltip('top', outputFolderInput, true, (element) => { return element.value; });
        outputFolderInput.parentElement.style.flexGrow = 1;
        outputFolderInput.style.width = `calc(100% - 73px)`;
    }

    if (settingsJSON.useLabelTooltips) {
        addTooltip('top', outputFolderLabel, false, (element) => { return 'FileChanger output folder'; });
    }
}

async function init() {
    await hashDict.loadHashList(progBar);
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
    live.addEventListener('change', (e) => { updateCache('version', 'Live'); });
    pts.addEventListener('change', (e) => { updateCache('version', 'pts'); });

    //mods related
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
    writeMod.addEventListener('click', (e) => { saveModal.style.display = ''; });
    loadMod.addEventListener('click', (e) => { ipcRenderer.send('openFileDialogChanger', loadMod.id); });
    convMod.addEventListener('click', async (e) => {
        const status = await MOD.convert(loadedModPath.value, fileChangesCont, fileChanges, writeMod, moddedParentFolder.value);
        if (status == 200) {
            log('Mod converted sucessfully!', 'info');
        } else {
            log('Error when converting mod.', 'alert');
        }
    });
    moddedParentFolder.addEventListener('change', (e) => {
        let val = e.currentTarget.value;
        if (fs.existsSync(val)) {
            convMod.classList.remove('disabled');
        } else {
            log('That is not a valid path', 'alert');
            moddedParentFolder.value = '';
        }
    });
    moddedParentFolderBrowseBtn.addEventListener('click', (e) => { ipcRenderer.send('openFolderDialogChanger', moddedParentFolder.id); });

    //changer functionality
    chngFiles.addEventListener('click', (e) => {
        if (fileChanges.length > 0) {
            log('File changing started.', 'info');
            changeFiles();
        } else {
            log('You have not specified any file changes.', 'alert');
        }
    })
    restoreBackup.addEventListener('click', (e) => { restoreBackupFiles(); });
    extrNode.addEventListener('click', (e) => {
        extrInput.setAttribute('data-tooltip', 'Node FQN');
        extrInput.dispatchEvent(updateTooltipEvent);

        extrModal.style.display = ''
    });
    extrFile.addEventListener('click', (e) => {
        extrInput.setAttribute('data-tooltip', 'File name');
        extrInput.dispatchEvent(updateTooltipEvent);

        extrModal.style.display = ''
    });

    //save modal functionality
    extrInput.addEventListener('change', (e) => {
        const val = e.currentTarget.value;
        if (val == '' || val == ' ') {
            startExtr.classList.add('disabled');
        } else {
            startExtr.classList.remove('disabled');
        }
    });
    startExtr.addEventListener('click', async (e) => {
        if (extrInput.getAttribute('data-tooltip') == 'Node FQN') {
            log('Extracting Node...', 'info');
            extractNode(extrInput.value);
        } else {
            log('Extracting File...', 'info');
            extractFile(extrInput.value);
        }

        extrModal.style.display = 'none';
        startExtr.classList.add('disabled');
        extrInput.value = '';
    });
    cancelExtr.addEventListener('click', (e) => {
        extrModal.style.display = 'none';
        startExtr.classList.add('disabled');
        extrInput.value = '';
    });

    //save modal functionality
    nameInput.addEventListener('change', (e) => {
        const val = e.currentTarget.value;
        if (val == '' || val == ' ' || (!validFilename(val))) {
            confirmSave.classList.add('disabled');
        } else {
            confirmSave.classList.remove('disabled');
        }
    });
    confirmSave.addEventListener('click', async (e) => {
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
            const success = await MOD.write(path.join(cache['output'], 'mods'), nameInput.value, functionalList);
            if (success == 200) { log('Mod created sucessfully!', 'info'); } else { log('Something went wrong when creating the mod.', 'alert'); }
            functionalList = [];
            nameInput.value = '';
        } else if (errList.length > 0) {
            infoDisp.innerHTML = errList.join(', ');
            errModal.style.display = '';
        }
        saveModal.style.display = 'none';
        confirmSave.classList.add('disabled');
    });
    cancelSave.addEventListener('click', (e) => {
        saveModal.style.display = 'none';
        confirmSave.classList.add('disabled');
        nameInput.value = '';
    });

    //err modal functionality
    contCreate.addEventListener('click', async (e) => {
        const success = await MOD.write(path.join(cache['output'], 'mods'), nameInput.value, functionalList);
        if (success == 200) { log('Incomplet mod created sucessfully!', 'info'); } else { log('Something went wrong when creating the incomplete mod.', 'alert'); }
        functionalList = [];
        errModal.style.display = 'none';
        infoDisp.innerHTML = '';
        nameInput.value = '';
    });
    cancelCreate.addEventListener('click', (e) => {
        errModal.style.display = 'none';
        infoDisp.innerHTML = '';
        nameInput.value = '';
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
                            assetsFolderInput.parentElement.style.flexGrow = 1;
                            assetsFolderInput.style.width = `calc(100% - 14px)`;
                            addTooltip('top', outputFolderInput, true, (element) => { return element.value; });
                            outputFolderInput.parentElement.style.flexGrow = 1;
                            outputFolderInput.style.width = `calc(100% - 73px)`;
                        } else {
                            removeTooltip(assetsFolderInput, true, (element) => { return element.value; });
                            assetsFolderInput.style.width = ``;
                            removeTooltip(outputFolderInput, true, (element) => { return element.value; });
                            outputFolderInput.style.width = ``;
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
    ipcRenderer.on('changerDialogResponse', async (event, data) => {
        if (data != "") {
            const id = data[0];
            const fPath = data[1][0];

            if (id == "loadMod") {
                if (path.extname(fPath) == '.tormod') {
                    moddedParentFolderBrowseBtn.style.display = 'none';
                    moddedParentFolder.style.display = 'none';
                    writeMod.classList.remove('disabled');
                    convMod.classList.add('disabled');

                    const status = await MOD.read(fPath, fileChangesCont, fileChanges, writeMod);
                    if (status == 200) {
                        loadedModPath.value = fPath;
                        log('Mod loaded sucessfully!', 'info');
                    } else {
                        log('Encountered error loading mod.', 'alert');
                    }
                } else if (path.extname(fPath) == '.txt') {
                    //TODO: parse the settings .txt and convert to a torc mod

                    loadedModPath.value = fPath;
                    writeMod.classList.add('disabled');
                    moddedParentFolder.style.display = '';
                    moddedParentFolderBrowseBtn.style.display = '';
                }
            } else {
                const mInput = document.getElementById(`${id}-ModdedInput`);
                mInput.value = fPath;
                mInput.dispatchEvent(chngEvn);
            }
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

//more complexed methods related to modifying/extracting unextracted, encoded files
const jsZip = require('jszip');

class ArchiveEntry {
    constructor(offset, metaDataSize, comprSize, uncomprSize, metaDataCheckSum, comprType, fileTableNum, fileTableFileIndex) {
        this.offset = offset;
        this.metaDataSize = metaDataSize;
        this.comprSize = comprSize;
        this.uncomprSize = uncomprSize;
        this.metaDataCheckSum = metaDataCheckSum;
        this.comprType = comprType;
        this.fileTableNum = fileTableNum;
        this.fileTableFileIndex = fileTableFileIndex;
    }
}
function extractFile(name) {
    
}

function extractNode(name) {
    
}

function restoreBackupFiles() {
    
}

function changeFiles() {
    
}

init();