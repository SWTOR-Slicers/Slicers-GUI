import { WEM } from '../../classes/formats/WEM.js';
import { BNK } from '../../classes/formats/BNK.js';
import { resourcePath } from "../../../api/config/resource-path/ResourcePath.js";
import { log, updateAlertType } from "../../universal/Logger.js";
import { addTooltip, removeTooltip, updateTooltipEvent } from "../../universal/Tooltips.js";
import { setSounds } from './MusicPlayer.js';
import { ww2ogg } from '../../Util.js';
import { getSetting } from '../../../api/config/settings/Settings.js';
import { ACB } from '@js/classes/ACB.js';

let settingsJSON = getSetting();

const fs = require('fs');
const {ipcRenderer} = require('electron');
const path = require('path');

const configPath = path.normalize(path.join(resourcePath, "config.json"));
const changeEvent = new Event('change');
const cache = {
    "soundPath": "",
    "output": ""
}

//action buttons
const convertFile = document.getElementById("convertFile");
const loadPreview = document.getElementById('loadPreview');
const progressBar = document.getElementById("progressBar");

//settings inputs
const soundPathLabel = document.getElementById('soundPathLabel');
const soundPathInput = document.getElementById("soundPathInput");

const folderPathBrowserBtn = document.getElementById('folderPathBrowserBtn');
const filePathBrowserBtn = document.getElementById("filePathBrowserBtn");

const outputPathLabel = document.getElementById('outputPathLabel');
const outputFolder = document.getElementById("outputFolder");
const outputBrowserBtn = document.getElementById("outputBrowserBtn");

async function initialize() {
    await loadCache();
    soundPathInput.value = cache["soundPath"];
    outputFolder.value = cache["output"];

    if (settingsJSON.usePathTooltips) {
        addTooltip('top', soundPathInput, true, (element) => { return element.value; });
        addTooltip('top', outputFolder, true, (element) => { return element.value; });
    }

    if (settingsJSON.useLabelTooltips) {
        addTooltip('top', soundPathLabel, false, (element) => { return 'Path to sound files or folder'; });
        addTooltip('top', outputPathLabel, false, (element) => { return 'Converter output folder'; });
        addTooltip('top', progressBar, false, (element) => { return 'Progress Bar'; });
    }
    
    initListeners();
    initSubs();
}
//cache management functions
async function loadCache() {
    let res = fs.readFileSync(configPath);
    let jsonObj = await JSON.parse(res);
    let json = jsonObj["soundConverter"];

    cache["soundPath"] = json["soundPath"];

    if (json["output"] == "" || !fs.existsSync(json["output"])) {
        const defaultPath = path.join(jsonObj["outputFolder"], 'sound');
        if (!fs.existsSync(defaultPath)) {
            fs.mkdirSync(defaultPath);
        }
        updateCache('output', defaultPath);
        cache["output"] = defaultPath
    } else {
        cache["output"] = json["output"];
    }
}
function updateCache(field, val) {
    const shouldUpdate = fs.existsSync(val); 
    if (shouldUpdate) {
        let res = fs.readFileSync(configPath);
        let json = JSON.parse(res);
        if (json["soundConverter"][field] != val) {
            json["soundConverter"][field] = val;
            cache[field] = val;
        
            fs.writeFileSync(configPath, JSON.stringify(json), null, '\t', 'utf-8');

            if (field == "output") {
                outputFolder.dispatchEvent(updateTooltipEvent);
            }
            if (field == "soundPath") {
                soundPathInput.dispatchEvent(updateTooltipEvent);
            }
        }
    } else {
        if (field == "output") {
            outputFolder.value = cache["output"];
        }
        if (field == "soundPath") {
            soundPathInput.value = cache["soundPath"];
        }
    }
}
//init dom listeners
function initListeners() {
    folderPathBrowserBtn.addEventListener("click", (e) => { ipcRenderer.send("showDialogSoundConv", "soundPath"); });
    filePathBrowserBtn.addEventListener("click", (e) => { ipcRenderer.send("showDialogSoundConvFile", "soundPath"); });
    outputBrowserBtn.addEventListener("click", (e) => { ipcRenderer.send("showDialogSoundConv", "output"); });
    convertFile.addEventListener("click", (e) => { initSoundConv(cache["output"], cache["soundPath"]); });
    loadPreview.addEventListener('click', (e) => {
        const contents = fs.readdirSync(outputFolder.value);
        const oggs = contents.filter(f => path.extname(f) == ".ogg");
        if (oggs.length > 0) {
            setSounds(oggs, outputFolder.value);
        } else {
            log('Your output folder has no .ogg files in it.', 'alert');
        }
    });

    //listener for unpack path and output fields
    outputFolder.addEventListener("change", (e) => {
        if (fs.existsSync(outputFolder.value)) {
            updateCache("output", outputFolder.value);
        } else {
            log(`That path is invalid, please input a valid path.`, 'alert');
            outputFolder.value = cache["output"];
        }
    });
    soundPathInput.addEventListener("change", (e) => {
        if (fs.existsSync(soundPathInput.value)) {
            updateCache("soundPath", soundPathInput.value);
        } else {
            log(`That path is invalid, please input a valid path.`, 'alert');
            soundPathInput.value = cache["soundPath"];
        }
    });
}
//initializes main process subscriptions
function initSubs() {
    ipcRenderer.on('updateSettings', (event, data) => {
        settingsJSON = data[1];
        for (const dEnt of data[0]) {
            if (!Array.isArray(dEnt)) {
                switch (dEnt) {
                    case "alerts":
                        updateAlertType(settingsJSON.alerts);
                        break;
                    case "usePathTooltips":
                        if (settingsJSON.usePathTooltips) {
                            addTooltip('top', soundPathInput, true, (element) => { return element.value; });
                            addTooltip('top', outputFolder, true, (element) => { return element.value; });
                        } else {
                            removeTooltip(soundPathInput, true, (element) => { return element.value; });
                            removeTooltip(outputFolder, true, (element) => { return element.value; });
                        }
                        break;
                    case "useLabelTooltips":
                        if (settingsJSON.useLabelTooltips) {
                            addTooltip('top', soundPathLabel, false, (element) => { return 'Path to sound files or folder'; });
                            addTooltip('top', outputPathLabel, false, (element) => { return 'Converter output folder'; });
                            addTooltip('top', progressBar, false, (element) => { return 'Progress Bar'; });
                        } else {
                            removeTooltip(soundPathLabel, false, (element) => { return 'Path to sound files or folder'; });
                            removeTooltip(outputPathLabel, false, (element) => { return 'Converter output folder'; });
                            removeTooltip(progressBar, false, (element) => { return 'Progress Bar'; });
                        }
                        break;
                }
            }
        }
    });
    ipcRenderer.on("recieveSoundConvDialog", (event, data) => {
        if (data != "") {
            const field = data[0];
            if (field == "soundPath") {
                soundPathInput.value = data[1][0];
                soundPathInput.dispatchEvent(changeEvent);
            } else if (field == "output") {
                outputFolder.value = data[1][0];
                outputFolder.dispatchEvent(changeEvent);
            }
        }
    });
    ipcRenderer.on("recieveSoundConvDialogFile", (event, data) => {
        if (data != "") {
            const field = data[0];
            if (field == "soundPath") {
                soundPathInput.value = data[1][0];
                soundPathInput.dispatchEvent(changeEvent);
            }
        }
    });
}

async function initSoundConv(outputDir, soundPath) {
    if (fs.statSync(soundPath).isDirectory()) {
        const dirContents = fs.readdirSync(soundPath);
        for (let i = 0; i < dirContents.length; i++) {
            const soundFile = dirContents[i];
            await downloadSoundFile(outputDir, soundFile);
            
            const percentage = (100.0 * i / dirContents.length).toFixed(2);
            progressBar.style.width = `${percentage}%`;
        }
        progressBar.style.width = `0%`;
    } else {
        const soundFile = soundPath;
        await downloadSoundFile(outputDir, soundFile);
    }
}

async function downloadSoundFile(outputPath, filePath) {
    const fileData = fs.readFileSync(filePath).buffer;

    if (path.extname(filePath) == ".bnk") {
        const bnk = new BNK(fileData);

        if (bnk.sections.DIDX) {
            for (let i = 0; i < bnk.sections.DIDX.files.length; i++) {
                const file = bnk.sections.DIDX.files[i];
                const oggBuffer = ww2ogg(file.dv);
                const blob = new Blob([oggBuffer]);
                const dName = file.id + '.ogg';
                
                fs.writeFileSync(path.join(outputPath, dName), Buffer.from(await blob.arrayBuffer()));
            }
        }
    } else if (path.extname(filePath) == ".wem") {
        const oggBuffer = new WEM(fileData).oggBuffer;
        const blob = new Blob([oggBuffer]);
        const dName = path.basename().substring(0, path.basename().lastIndexOf('.')) + '.ogg';
        
        fs.writeFileSync(path.join(outputPath, dName), Buffer.from(await blob.arrayBuffer()));
    } else if (path.extname(filePath) == ".acb") {
        const acb = new ACB(fileData);

        if (acb.audioFiles.length > 0) {
            for (const aFile of acb.audioFiles) {
                const oggBuffer = ww2ogg(aFile.dataview);
                const blob = new Blob([oggBuffer]);
                const dName = aFile.name.substr(0, aFile.name.length - 4) + '.ogg';
                
                fs.writeFileSync(path.join(outputPath, dName), Buffer.from(await blob.arrayBuffer()));
            }
        } else {
            log('The acb file did not contain any .wem file entries', 'alert');
        }
    }
}

initialize();