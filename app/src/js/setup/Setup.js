import { resourcePath, updateResourcePath } from "../../api/config/resource-path/ResourcePath.js";
import { getSetting } from "../../api/config/settings/Settings.js";
import { updateAlertType } from "../universal/Logger.js";
import { addTooltip, removeTooltip, updateTooltipEvent } from "../universal/Tooltips.js";

let settingsJSON = getSetting();

const fs = require('fs');
const {ipcRenderer} = require('electron');

const changeEvent = new Event('change');

//config variables
const langDrop = document.getElementById("langDrop");
const resourceDirLabel = document.getElementById('resourceDirLabel');
const resourceDirField = document.getElementById('resourceDirField');
const resourceDirFieldBtn = document.getElementById('resourceDirFieldBtn');

const assetsDirLabel = document.getElementById('assetsDirLabel');
const assetsDirField = document.getElementById('assetsDirField');
const assetsDirFieldBtn = document.getElementById('assetsDirFieldBtn');

const outputDirLabel = document.getElementById('outputDirLabel');
const outputDirField = document.getElementById('outputDirField');
const outputDirFieldBtn = document.getElementById('outputDirFieldBtn');

const proceedToGUI = document.getElementById('proceedToGUI');

const cache = {
    "resourceDirField": "",
    "assetsDirField": "",
    "outputDirField": "",
    "lang": "en_us"
}
//init
function init() {
    initTooltips();
    initSubs();
    initListeners();
}

function initListeners() {
    resourceDirField.addEventListener('change', (e) => {
        const elem = e.currentTarget;
        let newVal = elem.value;
        if (fs.existsSync(newVal)) {
            cache[elem.id] = newVal;
            elem.dispatchEvent(updateTooltipEvent);
            checkFieldCompl();
        } else {
            elem.value = cache[elem.id];
        }
    });
    resourceDirFieldBtn.addEventListener('click', (e) => {
        ipcRenderer.send('showBootConfigDialog', 'resourceDirBootConfig');
    });
    
    assetsDirField.addEventListener('change', (e) => {
        const elem = e.currentTarget;
        let newVal = elem.value;
        if (fs.existsSync(newVal)) {
            cache[elem.id] = newVal;
            elem.dispatchEvent(updateTooltipEvent);
            checkFieldCompl();
        } else {
            elem.value = cache[elem.id];
        }
    });
    assetsDirFieldBtn.addEventListener('click', (e) => {
        ipcRenderer.send('showBootConfigDialog', 'assetsDirBootConfig');
    });
    
    outputDirField.addEventListener('change', (e) => {
        const elem = e.currentTarget;
        let newVal = elem.value;
        if (fs.existsSync(newVal)) {
            cache[elem.id] = newVal;
            elem.dispatchEvent(updateTooltipEvent);
            checkFieldCompl();
        } else {
            elem.value = cache[elem.id];
        }
    });
    outputDirFieldBtn.addEventListener('click', (e) => {
        ipcRenderer.send('showBootConfigDialog', 'outputDirBootConfig');
    });

    langDrop.clickCallback = (e) => { cache["lang"] = e.currentTarget.innerHTML; }
    
    proceedToGUI.addEventListener('click', (e) => {
        updateResourcePath(resourceDirField.value);
        ipcRenderer.send('proceedToMain', [resourceDirField.value, assetsDirField.value, outputDirField.value, cache["lang"]]);
    });
}
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
                            addTooltip('top', resourceDirField, true, (element) => { return element.value; });
                            addTooltip('top', assetsDirField, true, (element) => { return element.value; });
                            addTooltip('top', outputDirField, true, (element) => { return element.value; });
                        } else {
                            removeTooltip(resourceDirField, true, (element) => { return element.value; });
                            removeTooltip(assetsDirField, true, (element) => { return element.value; });
                            removeTooltip(outputDirField, true, (element) => { return element.value; });
                        }
                        break;
                    case "useLabelTooltips":
                        if (settingsJSON.useLabelTooltips) {
                            addTooltip('top', proceedToGUI, false, (element) => { return 'Complete Boot'; });
                            addTooltip('top', resourceDirLabel, false, (element) => { return 'Location of GUI resources'; });
                            addTooltip('top', assetsDirLabel, false, (element) => { return 'Game Assets (.tor)'; });
                            addTooltip('top', outputDirLabel, false, (element) => { return 'Location of GUI output'; });
                        } else {
                            removeTooltip(proceedToGUI, false, (element) => { return 'Complete Boot'; });
                            removeTooltip(resourceDirLabel, false, (element) => { return 'Location of GUI resources'; });
                            removeTooltip(assetsDirLabel, false, (element) => { return 'Game Assets (.tor)'; });
                            removeTooltip(outputDirLabel, false, (element) => { return 'Location of GUI output'; });
                        }
                        break;
                }
            }
        }
    });
    ipcRenderer.on('resourceDirBootConfigReply', (event, data) => { handleFieldUpdate(resourceDirField, data[0]); });
    ipcRenderer.on('assetsDirBootConfigReply', (event, data) => { handleFieldUpdate(assetsDirField, data[0]); });
    ipcRenderer.on('outputDirBootConfigReply', (event, data) => { handleFieldUpdate(outputDirField, data[0]); });
}
function initTooltips() {
    if (settingsJSON.useLabelTooltips) {
        addTooltip('top', proceedToGUI, false, (element) => { return 'Complete Boot'; });
        addTooltip('top', resourceDirLabel, false, (element) => { return 'Location of GUI resources'; });
        addTooltip('top', assetsDirLabel, false, (element) => { return 'Game Assets (.tor)'; });
        addTooltip('top', outputDirLabel, false, (element) => { return 'Location of GUI output'; });
    }

    if (settingsJSON.usePathTooltips) {
        addTooltip('top', resourceDirField, true, (element) => { return element.value; });
        addTooltip('top', assetsDirField, true, (element) => { return element.value; });
        addTooltip('top', outputDirField, true, (element) => { return element.value; });
    }
}
function handleFieldUpdate(field, value) {
    field.value = value;
    field.dispatchEvent(changeEvent);
}
function checkFieldCompl() {
    if (resourceDirField.value !== "" && assetsDirField.value !== "" && outputDirField.value) {
        proceedToGUI.classList.remove('disabled');
    } else {
        proceedToGUI.classList.add('disabled');
    }
}

init();