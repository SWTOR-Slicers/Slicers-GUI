import {FolderTree} from "./FolderTree.js";

const {ipcRenderer} = require('electron');
const os = require('os');
const fs = require('fs');
const path = require('path');
const nodeDiskInfo = require('node-disk-info');

const changeEvent = new Event('change');
const disks = getDrives();

const homedir = os.homedir();
const desktop = `${homedir}${path.sep}Desktop`;
const history = [desktop, null, null, null, null, null, null, null, null, null];
let histIdx = 0;
let oldValue = desktop;

let treeList = document.getElementById("treeList");
let pathField = document.getElementById("pathField");
let browsePathsBtn = document.getElementById("browsePathsBtn");

let backArrowBtn = document.getElementById("backArrowBtn");
let forwardArrowBtn = document.getElementById("forwardArrowBtn");
let moveUpArrowBtn = document.getElementById("moveUpArrowBtn");
let refreshBtn = document.getElementById("refreshBtn");

let fileTree;

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
    } else {
        e.target.value = oldValue;
    }
}

fileTree = new FolderTree(desktop, null);

fileTree.render(treeList);

browsePathsBtn.onclick = (e) => {
    ipcRenderer.on("getDialogResponse", (event, data) => {
        pathField.value = data[0];
        pathField.dispatchEvent(changeEvent);
    });
    ipcRenderer.send("showDialogGR2");
}

refreshBtn.addEventListener("click", () => {
    fileTree.render(treeList);
});
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