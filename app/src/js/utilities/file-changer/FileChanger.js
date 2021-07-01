import { resourcePath } from "../../../api/config/resource-path/ResourcePath.js";
import { log, updateAlertType } from "../../universal/Logger.js";
import { addTooltip, removeTooltip, updateTooltipEvent } from "../../universal/Tooltips.js";
import { FileEntry } from "./FileEntry.js";

//consts
const { ipcRenderer } = require("electron");
const path = require('path');

const configPath = path.normalize(path.join(resourcePath, "config.json"));
const fileChanges = [];
const chngEvn = new Event('change');
const cache = {
    "assets": "",
    "backup": true,
    "version": "Live"
}
//DOM variables

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


async function loadCache() {
    let res = fs.readFileSync(configPath);
    let jsonObj = await JSON.parse(res);
    let json = jsonObj["fileChanger"];

    cache["version"] = json["version"];

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

async function init() {
    await loadCache();
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

            fileChanges.push(newChng);

            const newChngElem = newChng.render();
            fileChangesCont.appendChild(newChngElem);

            newChng.dropDown.clickCallback = (e) => { newChng.type = e.currentTarget.innerHTML; }
        }
    });

}

function initSubs() {
    ipcRenderer.on('changerDialogResponse', (event, data) => {
        if (data != "") {
            const id = data[0];
            const fPath = data[1][0];

            const mInput = document.getElementById(`${id}-ModdedInput`);
            mInput.value = fPath;
            mInput.dispatchEvent(chngEvn);
        }
    });
}

function verifyEntry(ent) {
    
}

init();