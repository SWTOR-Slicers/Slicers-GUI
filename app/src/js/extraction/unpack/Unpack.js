import { log } from "../../universal/Logger.js";

const ssn = require('ssn');
const fs = require('fs');

const {ipcRenderer} = require('electron');
const path = require('path');

const configPath = path.normalize(path.join(__dirname, "../../resources/config.json"));
const changeEvent = new Event('change');
let backupCache = {
    "unpackPath": "",
    "output": ""
}
const cacheInit = {
    "unpackPath": "",
    "output": ""
}
const cache = new Proxy(cacheInit, {
    set(target, property, value) {
        backupCache[property] = target[property];
        target[property] = value;
        return true;
    }
})

//action buttons
const unpackFile = document.getElementById("unpackFile");
const unpackDir = document.getElementById("unpackDir");
const progressBar = document.getElementById("progressBar");

//settings inputs
const filePathInput = document.getElementById("filePathInput");
const filePathBrowserBtn = document.getElementById("filePathBrowserBtn");
const outputInput = document.getElementById("outputInput");
const outputBrowserBtn = document.getElementById("outputBrowserBtn");

async function initialize() {
    await loadCache();
    filePathInput.value = cache["unpackPath"];
    outputInput.value = cache["output"];
    
    initListeners();
    initSubs();
}
//cache management functions
async function loadCache() {
    let res = fs.readFileSync(configPath);
    let jsonObj = await JSON.parse(res);
    let json = jsonObj["unpacker"];

    cache["unpackPath"] = json["unpackPath"];
    cache["output"] = json["output"];
}
function updateCache(field, val) {
    const shouldUpdate = fs.existsSync(val); 
    if (shouldUpdate) {
        let res = fs.readFileSync(configPath);
        let json = JSON.parse(res);
        if (json["unpacker"][field] != val) {
            json["unpacker"][field] = val;
            cache[field] = val;
        
            fs.writeFileSync(configPath, JSON.stringify(json), 'utf-8');
        }
    } else {
        if (field == "output") {
            outputInput.value = cache["output"];
        }
        if (field == "unpackPath") {
            filePathInput.value = cache["unpackPath"];
        }
    }
}
//init dom listeners
function initListeners() {
    filePathBrowserBtn.addEventListener("click", (e) => {
        ipcRenderer.send("showDialogUnpacker", "unpackPath");
    });
    outputBrowserBtn.addEventListener("click", (e) => {
        ipcRenderer.send("showDialogUnpacker", "output");
    });
    unpackFile.addEventListener("click", (e) => {
        unpack();
    });
    unpackDir.addEventListener("click", (e) => {
        unpack();
    });

    //listener for unpack path and output fields
    outputInput.addEventListener("change", (e) => {
        if (fs.existsSync(outputInput.value)) {
            updateCache("output", outputInput.value);
        } else {
            log(`That path is invalid, please input a valid path.`);
            outputInput.value = cache["output"];
        }
    });
    filePathInput.addEventListener("change", (e) => {
        if (fs.existsSync(filePathInput.value)) {
            updateCache("unpackPath", filePathInput.value);
        } else {
            log(`That path is invalid, please input a valid path.`);
            filePathInput.value = cache["unpackPath"];
        }
    });
}
//initializes main process subscriptions
function initSubs() {
    ipcRenderer.on("recieveDialogUnpacker", (event, data) => {
        if (data != "") {
            const field = data[0];
            if (field == "unpackPath") {
                filePathInput.value = data[1][0];
                filePathInput.dispatchEvent(changeEvent);
            } else if (field == "output") {
                outputInput.value = data[1][0];
                outputInput.dispatchEvent(changeEvent);
            }
        }
    });
}

function unpack(patchDir, tempDir, patchPath) {
    
}

async function unpackZip() {
    
}

async function unpackManifest() {
    
}

async function unpackSolidpkg() {
    
}

//utility methods

//get file using http library
async function getRemoteFile(dest, url) {
    return new Promise((resolve, reject) => {
        const request = http.get(url, (response) => {
            if (response.statusCode == 200) {
                const file = fs.createWriteStream(dest);
                response.pipe(file);

                var len = parseInt(response.headers['content-length'], 10);
                var downloaded = 0;
            
                response.on('data', (chunk) => {
                    downloaded += chunk.length;
                    const percentage = (100.0 * downloaded / len).toFixed(2);
                    //console.log(`Downloading ${percentage}% ${downloaded} bytes`);
                    progressBar.style.width = `${percentage}%`;
                });

                file.on('finish', () => {
                    progressBar.style.width = ``;
                    resolve("done");
                });
            } else {
                reject("error");
            }
        });
    });
}

initialize();