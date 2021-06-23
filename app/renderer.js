import { addTooltip, updateTooltipEvent, removeTooltip } from "./src/js/universal/Tooltips.js";
import { getSetting } from "./src/api/config/settings/Settings.js";
import { updateAlertType } from "./src/js/universal/Logger.js";
import { changeSource, playAudio, pauseAudio } from "./src/js/main/audio/BackgroundTheme.js";

const { ipcRenderer } = require('electron');
const path = require('path');

const logDisplay = document.getElementById("logDisplay");
const cache = {
    "extractionPreset": ""
};
const parent = path.normalize(path.join(__dirname, '../music'));

let settingsJSON = getSetting();
let alertType = settingsJSON.alerts;

//file path choosers
let assetsFolderLabel = document.getElementById('assetsFolderLabel');
let assetPopupBtn = document.getElementById("assetPopupBtn");
let assetTextField = document.getElementById("assetTextField");
let oldAssetValue;
let extractionPreset = document.getElementById('extractionPreset');

let outputFolderLabel = document.getElementById('outputFolderLabel');
let outputPopupBtn = document.getElementById("outputPopupBtn");
let outputTextField = document.getElementById("outputTextField");
let oldOutputValue;

let dataFolderLabel = document.getElementById('dataFolderLabel');
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

//settings btn
const settingsBtn = document.getElementById('settingsBtn');

//functions
function initialize() {
    initSubscribes();
    setConfigData();

    setupListeners();
    initDrops();
    initSettings();

    if (settingsJSON.ambientMusic.enabled) {
        switch (settingsJSON.ambientMusic.selected) {
            case "Theme":
                changeSource(path.join(parent, 'Theme'));
                break;
            case "Location":
                changeSource(path.join(parent, 'Location'));
                break;
            case "Cantina":
                changeSource(path.join(parent, 'Cantina'));
                break;
            case "Custom":
                changeSource(settingsJSON.ambientMusic.path);
                break;
        }
    }

    log("Boot up complete");
}
function initSettings() {
    if (settingsJSON.usePathTooltips) {
        addTooltip('top', assetTextField, true, (element) => { return element.value; });
        addTooltip('top', outputTextField, true, (element) => { return element.value; });
        addTooltip('top', dataTextField, true, (element) => { return element.value; });
    }

    if (settingsJSON.useLabelTooltips) {
        addTooltip('top', assetsFolderLabel, false, (element) => { return 'Game assets (.tor)'; });
        addTooltip('top', outputFolderLabel, false, (element) => { return 'GUI output folder'; });
        addTooltip('top', dataFolderLabel, false, (element) => { return 'Data data folder for use w/ locator'; });
    
        addTooltip('top', clearLogBtn, false, (element) => { return 'Clear Log'; });
        addTooltip('top', saveLogToFile, false, (element) => { return 'Log to File'; });
        addTooltip('top', expComprLogBtn, true, (element) => { return (element.classList.contains('popped') ? 'Compress Log' : 'Expand Log'); });
    
        addTooltip('top', settingsBtn, false, (element) => { return 'Settings'; });
    }
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
        log(`Extraction: Assets started, please stand by.`, 'info');
    });
    lctBtn.addEventListener("click", (e) => {
        ipcRenderer.send('runExec', 'locate');
        log(`Extraction: Locator started, please stand by.`, 'info');
    });
    unpack.addEventListener("click", (e) => {
        ipcRenderer.send('runExec', 'unpack');
        log(`Extraction: Unpack started.`, 'info');
    });
    genHashBtn.addEventListener("click", (e) => {
        ipcRenderer.send('runExec', 'genHash');
        log(`Extraction: Generate Hash started, please stand by.`, 'info');
    })

    //viewers
    gr2ViewBtn.addEventListener("click", (e) => {
        ipcRenderer.send('runExec', 'gr2Viewer');
        log(`Viewer: GR2 opened.`, 'info');
    });
    nvBtn.addEventListener("click", (e) => {
        ipcRenderer.send('runExec', 'nodeViewer');
        log(`Viewer: Node opened.`, 'info');
    });
    modelViewBtn.addEventListener("click", (e) => {
        ipcRenderer.send('runExec', 'modelViewer');
        log(`Viewer: Model opened.`, 'info');
    });
    worldViewBtn.addEventListener("click", (e) => {
        ipcRenderer.send('runExec', 'worldViewer');
        log(`Viewer: World opened.`, 'info');
    });

    //utilities
    fileChangerBtn.addEventListener("click", (e) => {
        ipcRenderer.send('runExec', 'fileChanger');
        log(`Utlity: File-Changer opened.`, 'info');
    });
    bnkConvBtn.addEventListener("click", (e) => {
        ipcRenderer.send('runExec', 'convBnk');
        log(`Utlity: Sound-Converter opened.`, 'info');
    });
    getPatchBtn.addEventListener("click", (e) => {
        ipcRenderer.send('runExec', 'getPatch');
        log(`Utlity: Patch-Getter opened.`, 'info');
    });
    walkthroughBtn.addEventListener("click", (e) => {
        ipcRenderer.send('runExec', 'walkthrough');
        log(`Utlity: Walkthrough opened.`, 'info');
    });

    //log related
    clearLogBtn.addEventListener('click', (e) => {
        //clear log
        const temp = logDisplay.children[logDisplay.children.length - 1];
        logDisplay.innerHTML = "";
        logDisplay.appendChild(temp);
        log('Log sucecssfully cleared!', 'info');
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

    //settings
    settingsBtn.addEventListener('click', (e) => {
        ipcRenderer.send('runExec', 'settings');
        log('Settings opened.', 'info');
    })
}
function initSubscribes() {
    ipcRenderer.on('restoredMain', (event, data) => { if (settingsJSON.ambientMusic.enabled && !settingsJSON.ambientMusic.playMinimized) playAudio(); });
    ipcRenderer.on('minimizedMain', (event, data) => { if (settingsJSON.ambientMusic.enabled && !settingsJSON.ambientMusic.playMinimized) pauseAudio(); });
    ipcRenderer.on('sendWindowStatus', (event, data) => {
        if (data[0] && settingsJSON.ambientMusic.enabled) {
            if (settingsJSON.ambientMusic.playMinimized) {
                playAudio();
            } else {
                pauseAudio();
            }
        }
    })
    ipcRenderer.on('updateSettings', (event, data) => {
        settingsJSON = data[1];
        for (const dEnt of data[0]) {
            if (Array.isArray(dEnt)) {
                const field = dEnt[1];
                const parent = dEnt[0];
                if (parent == "ambientMusic") {
                    switch (field) {
                        case "enabled":
                            if (settingsJSON.ambientMusic.enabled) {
                                switch (settingsJSON.ambientMusic.selected) {
                                    case "Theme":
                                        changeSource(path.join(parent, 'Theme'));
                                        break;
                                    case "Location":
                                        changeSource(path.join(parent, 'Location'));
                                        break;
                                    case "Cantina":
                                        changeSource(path.join(parent, 'Cantina'));
                                        break;
                                    case "Custom":
                                        changeSource(settingsJSON.ambientMusic.path);
                                        break;
                                }
                            } else {
                                pauseAudio();
                            }
                            break;
                        case "selected":
                            switch (settingsJSON.ambientMusic.selected) {
                                case "Theme":
                                    changeSource(path.join(parent, 'Theme'));
                                    break;
                                case "Location":
                                    changeSource(path.join(parent, 'Location'));
                                    break;
                                case "Cantina":
                                    changeSource(path.join(parent, 'Cantina'));
                                    break;
                                case "Custom":
                                    changeSource(settingsJSON.ambientMusic.path);
                                    break;
                            }
                            break;
                        case "path":
                            changeSource(settingsJSON.ambientMusic.path);
                            break;
                        case "playMinimized":
                            ipcRenderer.send('getWindowStatus');
                            break;
                    }
                }
            } else {
                switch (dEnt) {
                    case "alerts":
                        alertType = settingsJSON.alerts;
                        updateAlertType(settingsJSON.alerts);
                        break;
                    case "usePathTooltips":
                        if (settingsJSON.usePathTooltips) {
                            addTooltip('top', assetTextField, true, (element) => { return element.value; });
                            addTooltip('top', outputTextField, true, (element) => { return element.value; });
                            addTooltip('top', dataTextField, true, (element) => { return element.value; });
                        } else {
                            removeTooltip(assetTextField, true, (element) => { return element.value; });
                            removeTooltip(outputTextField, true, (element) => { return element.value; });
                            removeTooltip(dataTextField, true, (element) => { return element.value; });
                        }
                        break;
                    case "useLabelTooltips":
                        if (settingsJSON.useLabelTooltips) {
                            addTooltip('top', assetsFolderLabel, false, (element) => { return 'Game assets (.tor)'; });
                            addTooltip('top', outputFolderLabel, false, (element) => { return 'GUI output folder'; });
                            addTooltip('top', dataFolderLabel, false, (element) => { return 'Data data folder for use w/ locator'; });
                        
                            addTooltip('top', clearLogBtn, false, (element) => { return 'Clear Log'; });
                            addTooltip('top', saveLogToFile, false, (element) => { return 'Log to File'; });
                            addTooltip('top', expComprLogBtn, true, (element) => { return (element.classList.contains('popped') ? 'Compress Log' : 'Expand Log'); });
                        
                            addTooltip('top', settingsBtn, false, (element) => { return 'Settings'; });
                        } else {
                            removeTooltip(assetsFolderLabel, false, (element) => { return 'Game assets (.tor)'; });
                            removeTooltip(outputFolderLabel, false, (element) => { return 'GUI output folder'; });
                            removeTooltip(dataFolderLabel, false, (element) => { return 'Data data folder for use w/ locator'; });
                        
                            removeTooltip(clearLogBtn, false, (element) => { return 'Clear Log'; });
                            removeTooltip(saveLogToFile, false, (element) => { return 'Log to File'; });
                            removeTooltip(expComprLogBtn, true, (element) => { return (element.classList.contains('popped') ? 'Compress Log' : 'Expand Log'); });
                        
                            removeTooltip(settingsBtn, false, (element) => { return 'Settings'; });
                        }
                        break;
                }
            }
        }
    });
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
            log(`Assigned new path to assetsFolder field.`, 'info')
            oldAssetValue = assetTextField.value;
            assetTextField.dispatchEvent(updateTooltipEvent);
            if (!data[1]) {
                document.getElementById('All').click();
                extractionPreset.nextElementSibling.classList.add('disabled');
            }
        } else {
            log(`Invalid path. Reseting assetsFolder field to ${oldAssetValue}`, 'alert');
            assetTextField.value = oldAssetValue;
        }
    });
    ipcRenderer.on('outputFolderReply', (event, data) => {
        processResponse(data, outputTextField, 'outputFolder');
    });
    ipcRenderer.on('isDirOut', (event, data) => {
        if (data) {
            log(`Assigned new path to outputFolder field.`, 'info')
            oldOutputValue = outputTextField.value;
            outputTextField.dispatchEvent(updateTooltipEvent);
        } else {
            log(`Invalid path. Reseting outputFolder field to ${oldOutputValue}`, 'alert');
            outputTextField.value = oldOutputValue;
        }
    });
    ipcRenderer.on('dataFolderReply', (event, data) => {
        processResponse(data, dataTextField, 'dataFolder');
    });
    ipcRenderer.on('isDirDat', (event, data) => {
        if (data) {
            log(`Assigned new path to dataFolder field.`, 'info')
            oldDataValue = dataTextField.value;
            dataTextField.dispatchEvent(updateTooltipEvent);
        } else {
            log(`Invalid path. Reseting dataFolder field to ${oldDataValue}`, 'alert');
            dataTextField.value = oldDataValue;
        }
    });
    ipcRenderer.on('extrCompl', (event, data) => {
        log(`Extraction: Assets finished.`, 'info');
    });
    ipcRenderer.on('locCompl', (event, data) => {
        log(`Extraction: Locator finished.`, 'info');
    });
    ipcRenderer.on('unpkCompl', (event, data) => {
        log(`Extraction: Unpack finished.`, 'info');
    });
    ipcRenderer.on('genHashCompl', (event, data) => {
        log(`Extraction: Generate Hash finished.`, 'info');
    });
    ipcRenderer.on('gr2ViewClosed', (event, data) => {
        log(`Viewer: GR2 closed.`, 'info');
    });
    ipcRenderer.on('nodeViewClosed', (event, data) => {
        log(`Viewer: Node closed.`, 'info');
    });
    ipcRenderer.on('modViewClosed', (event, data) => {
        log(`Viewer: Model closed.`, 'info');
    });
    ipcRenderer.on('worViewClosed', (event, data) => {
        log(`Viewer: World closed.`, 'info');
    });
    ipcRenderer.on('utilFileChngClosed', (event, data) => {
        log(`Utility: File-Changer closed.`, 'info');
    });
    ipcRenderer.on('utilBnkClosed', (event, data) => {
        log(`Utility: Sound-Converter closed.`, 'info');
    });
    ipcRenderer.on('utilGPClosed', (event, data) => {
        log(`Utility: Patch-Getter closed.`, 'info');
    });
    ipcRenderer.on('walkthroughClosed', (event, data) => {
        log(`Utility: Walkthrough closed.`, 'info');
    });
    ipcRenderer.on('loggedToFile', (event, data) => {
        log(`Log sucessfully written to file. Location: ` + data[0], 'info');
    });
    ipcRenderer.on('loggerWindowClosed', (event, data) => {
        expComprLogBtn.classList.remove('popped');
        expComprLogBtn.innerHTML = '<i class="fas fa-expand-alt"></i>';
        poppedOutCover.style.display = '';
        expComprLogBtn.dispatchEvent(updateTooltipEvent);
        log(`Logger Compressed`, 'info');
    });
    ipcRenderer.on('sendPoppedLoggerData', (event, data) => {
        let logStr = [];
        for (let i = 0; i < logDisplay.children.length - 1; i++) {
            const chld = logDisplay.children[i];
            logStr.push(chld.innerText);
        }
        ipcRenderer.send('sendLoggerData', logStr);
    });
    ipcRenderer.on('settingsWindowClosed', (event, data) => {
        log('Settings closed.', 'info');
    });
}

async function processResponse(data, elem, param) {
    elem.value = data[0];
    elem.dispatchEvent(updateTooltipEvent);
    log(`Assigned new path to ${param} field.`, 'info')
}

function log(message, type=null) {
    ipcRenderer.send('logToPopped', message);
    let logMsg = message + "\n";

    let div = document.createElement("div");
    div.className = "log__item";
    div.innerHTML = logMsg;

    let termText = logDisplay.children[logDisplay.children.length - 1];
    logDisplay.insertBefore(div, termText);

    if (type) {
        if (alertType == 'All' || (alertType == 'Alert' && (type == 'alert' || type == 'error'))) {
            const alertElem = document.getElementsByTagName('log-alert')[0];
            alertElem.setAttribute('type', type);
            alertElem.setAttribute('visible', "true");
        }
    }
    
    termText.scrollIntoView();
}

initialize();