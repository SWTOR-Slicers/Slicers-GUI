// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
import { addTooltip, updateTooltipEvent } from "./src/js/universal/Tooltips.js";
const {ipcRenderer} = require('electron');
const ipc = ipcRenderer;
const logDisplay = document.getElementById("logDisplay");
const cache = {
    "extractionPreset": ""
};

//file path choosers
let assetPopupBtn = document.getElementById("assetPopupBtn");
let assetTextField = document.getElementById("assetTextField");
let oldAssetValue;
let extractionPreset = document.getElementById('extractionPreset');

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
const poppedOutCover= document.getElementById('poppedOutCover');

//functions
function initialize() {
    initSubscribes();
    setConfigData();

    setupListeners();
    initDrops();

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

function updateCache(field, value) {
    if (field == "extractionPreset") {
        if (value != cache['extractionPreset']) {
            ipcRenderer.send('updateExtractionPreset', value);
            cache['extractionPreset'] = value;
        }
    }
}

//initializes custom dropdown menus
function initDrops() {
    let customSelects = document.getElementsByClassName("custom-select");
    let custSelLen = customSelects.length;

    for (let i = 0; i < custSelLen; i++) {
        let select = customSelects[i].getElementsByTagName("select")[0];
        let selLen = select.length;
        
        let a = document.createElement("DIV");
        a.setAttribute("class", "select-selected");
        a.innerHTML = select.options[select.selectedIndex].innerHTML;
        customSelects[i].appendChild(a);
        
        let b = document.createElement("DIV");
        b.setAttribute("class", "select-items select-hide");

        for (let j = 1; j < selLen; j++) {
            let c = document.createElement("DIV");
            c.id = select.options[j].innerHTML;
            c.innerHTML = select.options[j].innerHTML;

            if (c.id == a.innerHTML) {
                c.classList.add("same-as-selected");
            }

            c.addEventListener("click", function(e) {
                let s = this.parentNode.parentNode.getElementsByTagName("select")[0];
                let sl = s.length;
                let h = this.parentNode.previousSibling;

                for (let i = 0; i < sl; i++) {
                    if (s.options[i].innerHTML == this.innerHTML) {
                        s.selectedIndex = i;
                        h.innerHTML = this.innerHTML;

                        let y = this.parentNode.getElementsByClassName("same-as-selected");
                        let yl = y.length;
                        for (let k = 0; k < yl; k++) {
                            y[k].removeAttribute("class");
                        }

                        this.setAttribute("class", "same-as-selected");

                        break;
                    }
                }

                updateCache(select.id, this.innerHTML);

                h.click();

            });

            b.appendChild(c);

        }

        customSelects[i].appendChild(b);

        a.addEventListener("click", function(e) {
            e.stopPropagation();
            closeAllSelect(this);
            this.nextSibling.classList.toggle("select-hide");
            this.classList.toggle("select-arrow-active");
        });
    }
    function closeAllSelect(elmnt) {
        var x, y, i, xl, yl, arrNo = [];
        x = document.getElementsByClassName("select-items");
        y = document.getElementsByClassName("select-selected");
        xl = x.length;
        yl = y.length;
        for (i = 0; i < yl; i++) {
            if (elmnt == y[i]) {
            arrNo.push(i)
            } else {
            y[i].classList.remove("select-arrow-active");
            }
        }
        for (i = 0; i < xl; i++) {
            if (arrNo.indexOf(i)) {
            x[i].classList.add("select-hide");
            }
        }
    }
    document.addEventListener("click", closeAllSelect);
}

function setConfigData() {
    ipcRenderer.send('getConfigJSON', "");
}

function setupListeners() {
    //file path choosers
    assetPopupBtn.addEventListener('click', () => {ipcRenderer.send('showDialog', 'assetsFolder');});
    assetTextField.addEventListener("change", (e) => {
        let newVal = e.currentTarget.value;
        ipcRenderer.send('updateJSON', ['assetsFolder', newVal]);
    });

    outputPopupBtn.addEventListener('click', () => {ipcRenderer.send('showDialog', 'outputFolder');});
    outputTextField.addEventListener("change", (e) => {
        let newVal = e.currentTarget.value;
        ipcRenderer.send('updateJSON', ['outputFolder', newVal]);
    });

    dataPopupBtn.addEventListener('click', () => {ipcRenderer.send('showDialog', 'dataFolder');});
    dataTextField.addEventListener("change", (e) => {
        let newVal = e.currentTarget.value;
        ipcRenderer.send('updateJSON', ['dataFolder', newVal]);
    });

    //extraction
    extrBtn.addEventListener("click", (e) => {
        ipcRenderer.send('runExec', 'extraction');
        log(`Extraction: Assets started, please stand by.`);
    });
    lctBtn.addEventListener("click", (e) => {
        ipcRenderer.send('runExec', 'locate');
        log(`Extraction: Locator started, please stand by.`);
    });
    unpack.addEventListener("click", (e) => {
        ipcRenderer.send('runExec', 'unpack');
        log(`Extraction: Unpack started.`);
    });
    genHashBtn.addEventListener("click", (e) => {
        ipcRenderer.send('runExec', 'genHash');
        log(`Extraction: Generate Hash started, please stand by.`);
    })

    //viewers
    gr2ViewBtn.addEventListener("click", (e) => {
        ipcRenderer.send('runExec', 'gr2Viewer');
        log(`Viewer: GR2 opened.`);
    });
    nvBtn.addEventListener("click", (e) => {
        ipcRenderer.send('runExec', 'nodeViewer');
        log(`Viewer: Node opened.`);
    });
    modelViewBtn.addEventListener("click", (e) => {
        ipcRenderer.send('runExec', 'modelViewer');
        log(`Viewer: Model opened.`);
    });
    worldViewBtn.addEventListener("click", (e) => {
        ipcRenderer.send('runExec', 'worldViewer');
        log(`Viewer: World opened.`);
    });

    //utilities
    fileChangerBtn.addEventListener("click", (e) => {
        ipcRenderer.send('runExec', 'fileChanger');
        log(`Utlity: File-Changer opened.`);
    });
    bnkConvBtn.addEventListener("click", (e) => {
        ipcRenderer.send('runExec', 'convBnk');
        log(`Utlity: Sound-Converter opened.`);
    });
    getPatchBtn.addEventListener("click", (e) => {
        ipcRenderer.send('runExec', 'getPatch');
        log(`Utlity: Patch-Getter opened.`);
    });
    walkthroughBtn.addEventListener("click", (e) => {
        ipcRenderer.send('runExec', 'walkthrough');
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
        let logStr = "";
        for (let i = 0; i < logDisplay.children.length - 1; i++) {
            const chld = logDisplay.children[i];
            logStr = logStr.concat('-:- ', chld.innerText, '\n');
        }
        logStr = logStr.concat('-:- END OF LOG -:-');
        ipcRenderer.send('logToFile', [outputTextField.value, logStr]);
    });
    expComprLogBtn.addEventListener('click', (e) => {
        //clear log
        if (!expComprLogBtn.classList.contains('popped')) {
            expComprLogBtn.classList.add('popped');
            expComprLogBtn.innerHTML = '<i class="fas fa-compress-alt"></i>';
            poppedOutCover.style.display = 'block';
            ipcRenderer.send('initLogger');
        } else {
            expComprLogBtn.classList.remove('popped');
            expComprLogBtn.innerHTML = '<i class="fas fa-expand-alt"></i>';
            poppedOutCover.style.display = '';
            ipcRenderer.send('closeLoggerWindow', "");
        }
        expComprLogBtn.dispatchEvent(updateTooltipEvent);
    });
}
function initSubscribes() {
    ipcRenderer.on('displayLog', (event, data) => {
        log(data);
    });
    ipcRenderer.on('sendConfigJSON', (event, data) => {
        let json = data[0];

        assetTextField.value = json.assetsFolder;
        oldAssetValue = json.assetsFolder;
        assetTextField.dispatchEvent(updateTooltipEvent);

        outputTextField.value = json.outputFolder;
        oldOutputValue = json.outputFolder;
        outputTextField.dispatchEvent(updateTooltipEvent);
        
        dataTextField.value = json.dataFolder;
        oldDataValue = json.dataFolder;
        dataTextField.dispatchEvent(updateTooltipEvent);

        extractionPreset.options[0].innerHTML = json.extraction.extractionPreset;

        if (data[1]) {
            extractionPreset.nextElementSibling.classList.add('disabled');
        }
    });
    ipcRenderer.on('assetsFolderReply', (event, data) => {
        if (!data[1]) {
            document.getElementById('All').click();
            extractionPreset.nextElementSibling.classList.add('disabled');
        }
        processResponse(data[0], assetTextField, 'assetsFolder');
    });
    ipcRenderer.on('isDirAsset', (event, data) => {
        const exists = data[0];
        if (exists) {
            log(`Assigned new path to assetsFolder field.`)
            oldAssetValue = assetTextField.value;
            assetTextField.dispatchEvent(updateTooltipEvent);
            if (!data[1]) {
                document.getElementById('All').click();
                extractionPreset.nextElementSibling.classList.add('disabled');
            }
        } else {
            log(`Invalid path. Reseting assetsFolder field to ${oldAssetValue}`);
            assetTextField.value = oldAssetValue;
        }
    });
    ipcRenderer.on('outputFolderReply', (event, data) => {
        processResponse(data, outputTextField, 'outputFolder');
    });
    ipcRenderer.on('isDirOut', (event, data) => {
        if (data) {
            log(`Assigned new path to outputFolder field.`)
            oldOutputValue = outputTextField.value;
            outputTextField.dispatchEvent(updateTooltipEvent);
        } else {
            log(`Invalid path. Reseting outputFolder field to ${oldOutputValue}`);
            outputTextField.value = oldOutputValue;
        }
    });
    ipcRenderer.on('dataFolderReply', (event, data) => {
        processResponse(data, dataTextField, 'dataFolder');
    });
    ipcRenderer.on('isDirDat', (event, data) => {
        if (data) {
            log(`Assigned new path to dataFolder field.`)
            oldDataValue = dataTextField.value;
            dataTextField.dispatchEvent(updateTooltipEvent);
        } else {
            log(`Invalid path. Reseting dataFolder field to ${oldDataValue}`);
            dataTextField.value = oldDataValue;
        }
    });
    ipcRenderer.on('extrCompl', (event, data) => {
        log(`Extraction: Assets finished.`);
    });
    ipcRenderer.on('locCompl', (event, data) => {
        log(`Extraction: Locator finished.`);
    });
    ipcRenderer.on('unpkCompl', (event, data) => {
        log(`Extraction: Unpack finished.`);
    });
    ipcRenderer.on('genHashCompl', (event, data) => {
        log(`Extraction: Generate Hash finished.`);
    });
    ipcRenderer.on('gr2ViewClosed', (event, data) => {
        log(`Viewer: GR2 closed.`);
    });
    ipcRenderer.on('nodeViewClosed', (event, data) => {
        log(`Viewer: Node closed.`);
    });
    ipcRenderer.on('modViewClosed', (event, data) => {
        log(`Viewer: Model closed.`);
    });
    ipcRenderer.on('worViewClosed', (event, data) => {
        log(`Viewer: World closed.`);
    });
    ipcRenderer.on('utilFileChngClosed', (event, data) => {
        log(`Utility: File-Changer closed.`);
    });
    ipcRenderer.on('utilBnkClosed', (event, data) => {
        log(`Utility: Sound-Converter closed.`);
    });
    ipcRenderer.on('utilGPClosed', (event, data) => {
        log(`Utility: Patch-Getter closed.`);
    });
    ipcRenderer.on('walkthroughClosed', (event, data) => {
        log(`Utility: Walkthrough closed.`);
    });
    ipcRenderer.on('loggedToFile', (event, data) => {
        log(`Log sucessfully written to file. Location: ` + data[0]);
    });
    ipcRenderer.on('loggerWindowClosed', (event, data) => {
        expComprLogBtn.classList.remove('popped');
        expComprLogBtn.innerHTML = '<i class="fas fa-expand-alt"></i>';
        poppedOutCover.style.display = '';
        expComprLogBtn.dispatchEvent(updateTooltipEvent);
        log(`Logger Compressed`);
    });
    ipcRenderer.on('sendPoppedLoggerData', (event, data) => {
        let logStr = [];
        for (let i = 0; i < logDisplay.children.length - 1; i++) {
            const chld = logDisplay.children[i];
            logStr.push(chld.innerText);
        }
        ipcRenderer.send('sendLoggerData', logStr);
    });
}

async function processResponse(data, elem, param) {
    elem.value = data[0];
    elem.dispatchEvent(updateTooltipEvent);
    log(`Assigned new path to ${param} field.`)
}

function log(message) {
    ipcRenderer.send('logToPopped', message);
    let logMsg = message + "\n";

    let div = document.createElement("div");
    div.className = "log__item";
    div.innerHTML = logMsg;

    let termText = logDisplay.children[logDisplay.children.length - 1];
    logDisplay.insertBefore(div, termText);

    termText.scrollIntoView();
}

initialize();