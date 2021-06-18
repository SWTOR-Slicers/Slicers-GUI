import { WEM } from '../../classes/WEM.js';
import { BNK } from '../../classes/BNK.js';
import { resourcePath } from "../../universal/ResourcePath.js"
import { log } from "../../universal/Logger.js";
import { addTooltip, updateTooltipEvent } from "../../universal/Tooltips.js";
import { setSounds } from './MusicPlayer.js';
import { ww2ogg } from '../../Util.js';

const fs = require('fs');
const http = require('http');
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
const soundPathInput = document.getElementById("soundPathInput");
const folderPathBrowserBtn = document.getElementById('folderPathBrowserBtn');
const filePathBrowserBtn = document.getElementById("filePathBrowserBtn");
const outputFolder = document.getElementById("outputFolder");
const outputBrowserBtn = document.getElementById("outputBrowserBtn");

async function initialize() {
    await loadCache();
    soundPathInput.value = cache["soundPath"];
    outputFolder.value = cache["output"];

    addTooltip('top', soundPathInput, true, (element) => {
        return element.value;
    });
    addTooltip('top', outputFolder, true, (element) => {
        return element.value;
    });
    addTooltip('top', progressBar, false, (element) => {
        return 'Progress Bar';
    });
    
    initListeners();
    initSubs();
}
//cache management functions
async function loadCache() {
    let res = fs.readFileSync(configPath);
    let jsonObj = await JSON.parse(res);
    let json = jsonObj["soundConverter"];

    cache["soundPath"] = json["soundPath"];

    if (json["output"] == "") {
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
        
            fs.writeFileSync(configPath, JSON.stringify(json), 'utf-8');

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
        const contents = fs.readdirSync(outputFolder);
        const oggs = contents.filter(f => path.extname(f) == "ogg");
        if (oggs.length > 0) {
            setSounds(oggs, outputFolder);
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
                console.log(oggBuffer);
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
    }
}

initialize();