// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
import * as THREE from './node_modules/three/build/three.module.js';
const ipc = window.api;
const logDisplay = document.getElementById("logDisplay");

//file path choosers
let assetPopupBtn = document.getElementById("assetPopupBtn");
let assetTextField = document.getElementById("assetTextField");
let outputPopupBtn = document.getElementById("outputPopupBtn");
let outputTextField = document.getElementById("outputTextField");
let dataPopupBtn = document.getElementById("dataPopupBtn");
let dataTextField = document.getElementById("dataTextField");

//extraction
let extrBtn = document.getElementById("extractionBtn");
let lctBtn = document.getElementById("locateBtn");

//viewers
let gr2ViewBtn = document.getElementById("gr2ViewBtn");
let nvBtn = document.getElementById("nodeViewBtn");
let modelViewBtn = document.getElementById("modelViewBtn");
let worldViewBtn = document.getElementById("worldViewBtn");

//utilities
let fileChangerBtn = document.getElementById("fileChangerBtn");
let bnkConvBtn = document.getElementById("bnkConverterBtn");
let getPatchBtn = document.getElementById("getPatchBtn");

//functions
function initialize() {
    setupListeners();

    log("Boot up complete");
}

function setupListeners() {
    //file path choosers
    assetPopupBtn.addEventListener('click', () => {
        ipc.receive('assetsFolderReply', (data) => {
            processResponse(data, assetTextField, 'assetsFolder');
        });
        ipc.send('showDialog', 'assetsFolder');
    });
    outputPopupBtn.addEventListener('click', () => {
        ipc.receive('outputFolderReply', (data) => {
            processResponse(data, outputTextField, 'outputFolder');
        });
        ipc.send('showDialog', 'outputFolder');
    });
    dataPopupBtn.addEventListener('click', () => {
        ipc.receive('dataFolderReply', (data) => {
            processResponse(data, dataTextField, 'dataFolder');
        });
        ipc.send('showDialog', 'dataFolder');
    });

    //extraction
    extrBtn.addEventListener("click", (e) => {
        ipc.receive('extrCompl', (data) => {
            log(`Extraction: Assets finished.`);
        });
        ipc.send('runExec', 'extraction');
        log(`Extraction: Assets started, please stand by.`);
    });
    lctBtn.addEventListener("click", (e) => {
        ipc.receive('locCompl', (data) => {
            log(`Extraction: Locator finished.`);
        });
        ipc.send('runExec', 'locate');
        log(`Extraction: Locator started, please stand by.`);
    });

    //viewers
    gr2ViewBtn.addEventListener("click", (e) => {
        ipc.receive('gr2ViewClosed', (data) => {
            log(`Viewer: GR2 closed.`);
        });
        ipc.send('runExec', 'gr2Viewer');
        log(`Viewer: GR2 opened.`);
    });
    nvBtn.addEventListener("click", (e) => {
        ipc.receive('nodeViewClosed', (data) => {
            log(`Viewer: Node closed.`);
        });
        ipc.send('runExec', 'nodeViewer');
        log(`Viewer: Node opened.`);
    });
    modelViewBtn.addEventListener("click", (e) => {
        ipc.receive('modViewClosed', (data) => {
            log(`Viewer: Model closed.`);
        });
        ipc.send('runExec', 'modelViewer');
        log(`Viewer: Model opened.`);
    });
    worldViewBtn.addEventListener("click", (e) => {
        ipc.receive('worViewClosed', (data) => {
            log(`Viewer: World closed.`);
        });
        ipc.send('runExec', 'worldViewer');
        log(`Viewer: World opened.`);
    });

    //utilities
    fileChangerBtn.addEventListener("click", (e) => {
        ipc.receive('utilFileChngClosed', (data) => {
            log(`Utility: File-Changer closed.`);
        });
        ipc.send('runExec', 'convBnk');
        log(`Utlity: File-Changer opened.`);
    });
    bnkConvBtn.addEventListener("click", (e) => {
        ipc.receive('utilBnkClosed', (data) => {
            log(`Utility: BNK-Converter closed.`);
        });
        ipc.send('runExec', 'convBnk');
        log(`Utlity: BNK-Converter opened.`);
    });
    getPatchBtn.addEventListener("click", (e) => {
        ipc.receive('utilGPClosed', (data) => {
            log(`Utility: Patch-Getter closed.`);
        });
        ipc.send('runExec', 'getPatch');
        log(`Utlity: Patch-Getter opened.`);
    });
}

async function processResponse(data, elem, param) {
    elem.value = data[0];
    log(`Assigned new path to ${param} field.`)
}

function log(message) {
    let logMsg = message + "\n";

    let div = document.createElement("div");
    div.className = "log__item";
    div.innerHTML = logMsg;

    let termText = logDisplay.children[logDisplay.children.length - 1];
    logDisplay.insertBefore(div, termText);
}

initialize();