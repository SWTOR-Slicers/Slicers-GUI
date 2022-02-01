import {FolderTree} from "./FolderTree.js";
import { addTooltip, updateTooltipEvent } from "../../universal/Tooltips.js";
import { log, updateAlertType } from "../../universal/Logger.js";
import { getSetting } from "../../../api/config/settings/Settings.js";

let settingsJSON = getSetting();

const {ipcRenderer} = require('electron');
const os = require('os');
const fs = require('fs');
const path = require('path');
const nodeDiskInfo = require('node-disk-info');

const changeEvent = new Event('change');
const disks = getDrives();

const homedir = os.homedir();
const desktop = path.join(homedir, 'Desktop');
const downloads = path.join(homedir, 'Downloads');
const documents = path.join(homedir, 'Documents');
const history = [desktop, null, null, null, null, null, null, null, null, null];

let histIdx = 0;
let oldValue = desktop;

const viewerWindow = document.getElementById('viewerWindow');
const fileTreeContainer = document.getElementById('fileTreeContainer');
const treeList = document.getElementById("treeList");
const leftDrag = document.getElementById('leftDrag');
let leftResize = false;

const viewContainer = document.getElementById('viewContainer');

let rightResize = false;
const rightDrag = document.getElementById('rightDrag');
const dataViewContainer = document.getElementById('dataViewContainer');

const pathField = document.getElementById("pathField");
const browsePathsBtn = document.getElementById("browsePathsBtn");
const quickNavCont = document.getElementsByClassName('quick-nav-contents')[0];

const backArrowBtn = document.getElementById("backArrowBtn");
const forwardArrowBtn = document.getElementById("forwardArrowBtn");
const moveUpArrowBtn = document.getElementById("moveUpArrowBtn");
const refreshBtn = document.getElementById("refreshBtn");

let fileTree;

function initialize() {
    pathField.onchange = (e) => {
        let newValue = e.currentTarget.value;
    
        if (fs.existsSync(newValue) && newValue != oldValue) {
            if (fileTree.path != newValue) {
                fileTree.reInit(newValue);
                fileTree.render(treeList);
            }
            if (history[histIdx + 1]) {
                if (history[histIdx + 1] != newValue) {
                    for (let i = histIdx + 2; i < history.length; i++) {
                        history[i] = null;
                    }
                } else {
                    history[histIdx + 1] = newValue;
                }
                histIdx++;
            } else {
                if (histIdx == history.length - 1) {
                    for(let i = 1; i < history.length; i++) {
                        history[i - 1] = history[i];
                    }
                    history[histIdx] = newValue;
                } else {
                    history[histIdx + 1] = newValue;
                    histIdx++;
                }
            }
            
            oldValue = newValue;
    
            checkForArrows();

            e.currentTarget.dispatchEvent(updateTooltipEvent);
        } else {
            e.target.value = oldValue;
        }
    }
    
    fileTree = new FolderTree(desktop, null);
    
    fileTree.render(treeList);

    if (settingsJSON.usePathTooltips) {
        addTooltip('top', pathField, true, (element) => { return element.value; });
    }

    addQuickNav();
    initListeners();
    initSubs();
}
function addQuickNav() {
    //add desktop
    addNavElem('Desktop', 'fas fa-home', desktop);
    //add downloads
    addNavElem('Downloads', 'fas fa-arrow-alt-circle-down', downloads);
    //add documents
    addNavElem('Documents', 'fas fa-file', documents);
    //add all drives
    try {
        const drives = nodeDiskInfo.getDiskInfoSync();
        
        for (const drive of drives) {
            addNavElem(`${drive.mounted.substring(0, 1)} Drive`, drive.mounted, path.join(drive.mounted, path.sep), true);
        }
    } catch (e) {
        console.error(e);
        log('The drives failed to be loaded in the quick nav.', 'alert');
    }
}
function addNavElem(title, iClass, pathToSet, isDrive=false) {
    const elem = document.createElement('div');
    elem.className = 'quick-nav-elem';

    const elemIcon = document.createElement('div');
    if (isDrive) {
        elemIcon.className = 'quick-nav-icon-text';
        elemIcon.innerHTML = iClass;
    } else {
        elemIcon.className = 'quick-nav-icon';
        elemIcon.innerHTML = `<i class="${iClass}"></i>`;
    }
    elem.appendChild(elemIcon);

    const elemTitle = document.createElement('div');
    elemTitle.className = 'quick-nav-label';
    elemTitle.innerHTML = title;
    elem.appendChild(elemTitle);

    elem.addEventListener('click', (e) => {
        pathField.value = pathToSet;
        pathField.dispatchEvent(changeEvent);
    })

    quickNavCont.appendChild(elem);
}
function initListeners() {
    leftDrag.addEventListener('mousedown', (e) => { leftResize = true; });
    rightDrag.addEventListener('mousedown', (e) => { rightResize = true; });
    document.addEventListener('mouseup', (e) => {
        if (leftResize) leftResize = false;
        if (rightResize) rightResize = false;
    });
    document.addEventListener('mousemove', (e) => {
        if (leftResize) {
            let changePercent = ((e.clientX) / viewerWindow.clientWidth) * 100;
            let existingIncr = dataViewContainer.clientWidth / viewerWindow.clientWidth * 100;
            fileTreeContainer.style.width = `${changePercent}%`;
            viewContainer.style.width = `${100 - changePercent - existingIncr}%`;
        } else if (rightResize) {
            let changePercent = ((e.clientX) / viewerWindow.clientWidth) * 100;
            let existingIncr = fileTreeContainer.clientWidth / viewerWindow.clientWidth * 100;
            changePercent -= existingIncr;
            viewContainer.style.width = `${changePercent}%`;
            dataViewContainer.style.width = `${100 - changePercent - existingIncr}%`;
        }
    });
    browsePathsBtn.onclick = (e) => { ipcRenderer.send("showDialogGR2"); }
    
    refreshBtn.addEventListener("click", () => { fileTree.render(treeList); });
    moveUpArrowBtn.addEventListener('click', (e) => {
        let newPath = path.join(pathField.value, "..");
    
        pathField.value = newPath;
        pathField.dispatchEvent(changeEvent);
    });
    backArrowBtn.addEventListener("click", (e) => {
        histIdx--;
        fileTree.reInit(history[histIdx]);
        checkForArrows();
        fileTree.render(treeList);
    });
    forwardArrowBtn.addEventListener("click", (e) => {
        histIdx++;
        fileTree.reInit(history[histIdx]);
        checkForArrows();
        fileTree.render(treeList);
    });
}
function initSubs() {
    ipcRenderer.on('updateSettings', (event, data) => {
        settingsJSON = data[1];
        for (const dEnt of data[0]) {
            if (!Array.isArray(dEnt)) {
                switch (dEnt) {
                    case "alerts":
                        alertType = settingsJSON.alerts;
                        updateAlertType(settingsJSON.alerts);
                        break;
                }
            }
        }
    });
    ipcRenderer.on("getDialogResponseGR2", (event, data) => {
        pathField.value = data[0];
        pathField.dispatchEvent(changeEvent);
    });
}

function checkForArrows() {
    if (histIdx == 0) {
        backArrowBtn.classList.add("fbh__disabled");
    } else {
        backArrowBtn.classList.remove("fbh__disabled");
    }

    if (histIdx == history.length - 1) {
        forwardArrowBtn.classList.add("fbh__disabled");
    } else if (history[histIdx + 1]) {
        forwardArrowBtn.classList.remove("fbh__disabled");
    } else {
        forwardArrowBtn.classList.add("fbh__disabled");
    }

    if (!disks.includes(pathField.value)) {
        moveUpArrowBtn.classList.remove("fbh__disabled");
    } else {
        moveUpArrowBtn.classList.add("fbh__disabled");
    }
}
function getDrives() {
    let disksNames = [];
    try {
        const disks = nodeDiskInfo.getDiskInfoSync();
        
        for (const disk of disks) {
            disksNames.push(path.join(disk.mounted, path.sep));
        }
    } catch (e) {
        console.error(e);
    }
    return disksNames;
}

initialize();