import { resourcePath, updateResourcePath } from "../universal/ResourcePath.js";
import { addTooltip, updateTooltipEvent } from "../universal/Tooltips.js";

const fs = require('fs');
const {ipcRenderer} = require('electron');

const changeEvent = new Event('change');

//config variables
const resourceDirField = document.getElementById('resourceDirField');
const resourceDirFieldBtn = document.getElementById('resourceDirFieldBtn');

const assetsDirField = document.getElementById('assetsDirField');
const assetsDirFieldBtn = document.getElementById('assetsDirFieldBtn');

const outputDirField = document.getElementById('outputDirField');
const outputDirFieldBtn = document.getElementById('outputDirFieldBtn');

const proceedToGUI = document.getElementById('proceedToGUI');

const cache = {
    "resourceDirField": "",
    "assetsDirField": "",
    "outputDirField": ""
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
    
    proceedToGUI.addEventListener('click', (e) => {
        updateResourcePath(resourceDirField.value);
        console.log(resourcePath);
        ipcRenderer.send('proceedToMain', [resourceDirField.value, assetsDirField.value, outputDirField.value]);
    });
}
function initSubs() {
    ipcRenderer.on('resourceDirBootConfigReply', (event, data) => {
        handleFieldUpdate(resourceDirField, data[0]);
    });
    ipcRenderer.on('assetsDirBootConfigReply', (event, data) => {
        handleFieldUpdate(assetsDirField, data[0]);
    });
    ipcRenderer.on('outputDirBootConfigReply', (event, data) => {
        handleFieldUpdate(outputDirField, data[0]);
    });
}
function initTooltips() {
    addTooltip('top', proceedToGUI, true, (element) => {
        return 'Complete Boot';
    });
    addTooltip('top', resourceDirField.previousElementSibling, true, (element) => {
        return 'Location of GUI resources';
    });
    addTooltip('top', assetsDirField.previousElementSibling, true, (element) => {
        return 'Game Assets (.tor)';
    });
    addTooltip('top', outputDirField.previousElementSibling, true, (element) => {
        return 'Location of GUI output';
    });

    addTooltip('top', resourceDirField, true, (element) => {
        return element.value;
    });
    addTooltip('top', assetsDirField, true, (element) => {
        return element.value;
    });
    addTooltip('top', outputDirField, true, (element) => {
        return element.value;
    });
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