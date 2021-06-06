// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
import { addTooltip, updateTooltipEvent } from "./src/js/universal/Tooltips.js";
const ipc = window.api;
const logDisplay = document.getElementById("logDisplay");

//file path choosers
let assetPopupBtn = document.getElementById("assetPopupBtn");
let assetTextField = document.getElementById("assetTextField");
let oldAssetValue;

let outputPopupBtn = document.getElementById("outputPopupBtn");
let outputTextField = document.getElementById("outputTextField");
let oldOutputValue;

let dataPopupBtn = document.getElementById("dataPopupBtn");
let dataTextField = document.getElementById("dataTextField");
let oldDataValue;

//extraction
let extrBtn = document.getElementById("extractionBtn");
let lctBtn = document.getElementById("locateBtn");
let genHashBtn = document.getElementById("genHashBtn");
let unpack = document.getElementById("unpack");

//viewers
let gr2ViewBtn = document.getElementById("gr2ViewBtn");
let nvBtn = document.getElementById("nodeViewBtn");
let modelViewBtn = document.getElementById("modelViewBtn");
let worldViewBtn = document.getElementById("worldViewBtn");

//utilities
let fileChangerBtn = document.getElementById("fileChangerBtn");
let bnkConvBtn = document.getElementById("bnkConverterBtn");
let getPatchBtn = document.getElementById("getPatchBtn");
let walkthroughBtn = document.getElementById("walkthroughBtn");

//log related
const clearLogBtn = document.getElementById('clearLogBtn');
const saveLogToFile = document.getElementById('saveLogToFile');
const expComprLogBtn = document.getElementById('expComprLogBtn');

//functions
function initialize() {
    initSubscribes();
    setConfigData();

    setupListeners();

    addTooltip('top', assetTextField, true, (element) => {
        return element.value;
    });
    addTooltip('top', outputTextField, true, (element) => {
        return element.value;
    });
    addTooltip('top', dataTextField, true, (element) => {
        return element.value;
    });

    addTooltip('top', clearLogBtn, false, (element) => {
        return 'Clear Log';
    });
    addTooltip('top', saveLogToFile, false, (element) => {
        return 'Log to File';
    });
    addTooltip('top', expComprLogBtn, true, (element) => {
        return (element.classList.contains('popped') ? 'Compress Log' : 'Expand Log');
    });

    log("Boot up complete");
}

function setConfigData() {
    ipc.send('getConfigJSON', "");
}

function setupListeners() {
    //file path choosers
    assetPopupBtn.addEventListener('click', () => {ipc.send('showDialog', 'assetsFolder');});
    assetTextField.addEventListener("change", (e) => {
        let newVal = e.currentTarget.value;
        ipc.send('updateJSON', ['assetsFolder', newVal]);
    });

    outputPopupBtn.addEventListener('click', () => {ipc.send('showDialog', 'outputFolder');});
    outputTextField.addEventListener("change", (e) => {
        let newVal = e.currentTarget.value;
        ipc.send('updateJSON', ['outputFolder', newVal]);
    });

    dataPopupBtn.addEventListener('click', () => {ipc.send('showDialog', 'dataFolder');});
    dataTextField.addEventListener("change", (e) => {
        let newVal = e.currentTarget.value;
        ipc.send('updateJSON', ['dataFolder', newVal]);
    });

    //extraction
    extrBtn.addEventListener("click", (e) => {
        ipc.send('runExec', 'extraction');
        log(`Extraction: Assets started, please stand by.`);
    });
    lctBtn.addEventListener("click", (e) => {
        ipc.send('runExec', 'locate');
        log(`Extraction: Locator started, please stand by.`);
    });
    unpack.addEventListener("click", (e) => {
        ipc.send('runExec', 'unpack');
        log(`Extraction: Unpack started.`);
    });
    genHashBtn.addEventListener("click", (e) => {
        ipc.send('runExec', 'genHash');
        log(`Extraction: Generate Hash started, please stand by.`);
    })

    //viewers
    gr2ViewBtn.addEventListener("click", (e) => {
        ipc.send('runExec', 'gr2Viewer');
        log(`Viewer: GR2 opened.`);
    });
    nvBtn.addEventListener("click", (e) => {
        ipc.send('runExec', 'nodeViewer');
        log(`Viewer: Node opened.`);
    });
    modelViewBtn.addEventListener("click", (e) => {
        ipc.send('runExec', 'modelViewer');
        log(`Viewer: Model opened.`);
    });
    worldViewBtn.addEventListener("click", (e) => {
        ipc.send('runExec', 'worldViewer');
        log(`Viewer: World opened.`);
    });

    //utilities
    fileChangerBtn.addEventListener("click", (e) => {
        ipc.send('runExec', 'fileChanger');
        log(`Utlity: File-Changer opened.`);
    });
    bnkConvBtn.addEventListener("click", (e) => {
        ipc.send('runExec', 'convBnk');
        log(`Utlity: BNK-Converter opened.`);
    });
    getPatchBtn.addEventListener("click", (e) => {
        ipc.send('runExec', 'getPatch');
        log(`Utlity: Patch-Getter opened.`);
    });
    walkthroughBtn.addEventListener("click", (e) => {
        ipc.send('runExec', 'walkthrough');
        log(`Utlity: Walkthrough opened.`);
    });

    //log related
    clearLogBtn.addEventListener('click', (e) => {
        //clear log
        const temp = logDisplay.children[logDisplay.children.length - 1];
        logDisplay.innerHTML = "";
        logDisplay.appendChild(temp);
        log('Log sucecssfully cleared!');
    });
    saveLogToFile.addEventListener('click', (e) => {
        //save log
        //compute log here
        let logStr = "";
        for (let i = 0; i < logDisplay.children.length - 1; i++) {
            const chld = logDisplay.children[i];
            logStr = logStr.concat('-:- ', chld.innerText, '\n');
        }
        logStr = logStr.concat('-:- END OF LOG -:-');
        ipc.send('logToFile', [outputTextField.value, logStr]);
    });
    expComprLogBtn.addEventListener('click', (e) => {
        //clear log
        expComprLogBtn.classList.toogle('popped');
        expComprLogBtn.dispatchEvent(updateTooltipEvent);
    });
}
function initSubscribes() {
    ipc.receive('displayLog', (data) => {
        log(data);
    })
    ipc.receive('sendConfigJSON', (data) => {
        let json = data;

        assetTextField.value = json.assetsFolder;
        oldAssetValue = json.assetsFolder;
        assetTextField.dispatchEvent(updateTooltipEvent);

        outputTextField.value = json.outputFolder;
        oldOutputValue = json.outputFolder;
        outputTextField.dispatchEvent(updateTooltipEvent);
        
        dataTextField.value = json.dataFolder;
        oldDataValue = json.dataFolder;
        dataTextField.dispatchEvent(updateTooltipEvent);
    });
    ipc.receive('assetsFolderReply', (data) => {
        processResponse(data, assetTextField, 'assetsFolder');
    });
    ipc.receive('isDirAsset', (data) => {
        if (data) {
            log(`Assigned new path to assetsFolder field.`)
            oldAssetValue = assetTextField.value;
            assetTextField.dispatchEvent(updateTooltipEvent);
        } else {
            log(`Invalid path. Reseting assetsFolder field to ${oldAssetValue}`);
            assetTextField.value = oldAssetValue;
        }
    });
    ipc.receive('outputFolderReply', (data) => {
        processResponse(data, outputTextField, 'outputFolder');
    });
    ipc.receive('isDirOut', (data) => {
        if (data) {
            log(`Assigned new path to outputFolder field.`)
            oldOutputValue = outputTextField.value;
            outputTextField.dispatchEvent(updateTooltipEvent);
        } else {
            log(`Invalid path. Reseting outputFolder field to ${oldOutputValue}`);
            outputTextField.value = oldOutputValue;
        }
    });
    ipc.receive('dataFolderReply', (data) => {
        processResponse(data, dataTextField, 'dataFolder');
    });
    ipc.receive('isDirDat', (data) => {
        if (data) {
            log(`Assigned new path to dataFolder field.`)
            oldDataValue = dataTextField.value;
            dataTextField.dispatchEvent(updateTooltipEvent);
        } else {
            log(`Invalid path. Reseting dataFolder field to ${oldDataValue}`);
            dataTextField.value = oldDataValue;
        }
    });
    ipc.receive('extrCompl', (data) => {
        log(`Extraction: Assets finished.`);
    });
    ipc.receive('locCompl', (data) => {
        log(`Extraction: Locator finished.`);
    });
    ipc.receive('unpkCompl', (data) => {
        log(`Extraction: Unpack finished.`);
    });
    ipc.receive('genHashCompl', (data) => {
        log(`Extraction: Generate Hash finished.`);
    });
    ipc.receive('gr2ViewClosed', (data) => {
        log(`Viewer: GR2 closed.`);
    });
    ipc.receive('nodeViewClosed', (data) => {
        log(`Viewer: Node closed.`);
    });
    ipc.receive('modViewClosed', (data) => {
        log(`Viewer: Model closed.`);
    });
    ipc.receive('worViewClosed', (data) => {
        log(`Viewer: World closed.`);
    });
    ipc.receive('utilFileChngClosed', (data) => {
        log(`Utility: File-Changer closed.`);
    });
    ipc.receive('utilBnkClosed', (data) => {
        log(`Utility: BNK-Converter closed.`);
    });
    ipc.receive('utilGPClosed', (data) => {
        log(`Utility: Patch-Getter closed.`);
    });
    ipc.receive('walkthroughClosed', (data) => {
        log(`Utility: Walkthrough closed.`);
    });
    ipc.receive('loggedToFile', (data) => {
        log(`Log sucessfully written to file. Location: ` + data[0]);
    });
}

async function processResponse(data, elem, param) {
    elem.value = data[0];
    elem.dispatchEvent(updateTooltipEvent);
    log(`Assigned new path to ${param} field.`)
}

function log(message) {
    let logMsg = message + "\n";

    let div = document.createElement("div");
    div.className = "log__item";
    div.innerHTML = logMsg;

    let termText = logDisplay.children[logDisplay.children.length - 1];
    logDisplay.insertBefore(div, termText);

    termText.scrollIntoView();
}

initialize();