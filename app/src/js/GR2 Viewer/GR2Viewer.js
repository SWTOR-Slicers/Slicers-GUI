import {FolderTree} from "./FolderTree.js";

const THREE = require('three');
const os = require('os');
const fs = require('fs');
const {dialog, remote} = require('electron');

const homedir = os.homedir();
const desktop = `${homedir}\\Desktop`;
const history = [desktop, null, null, null, null, null, null, null, null, null];
let histIdx = 0;
let oldValue = desktop;

let treeList = document.getElementById("treeList");
let pathField = document.getElementById("pathField");
let browsePathsBtn = document.getElementById("browsePathsBtn");

let backArrowBtn = document.getElementById("backArrowBtn");
let fowardArrowBtn = document.getElementById("fowardArrowBtn");
let moveUpArrowBtn = document.getElementById("moveUpArrowBtn");
let refreshBtn = document.getElementById("refreshBtn");



let fileTree;

pathField.onchange = (e) => {
    let newValue = e.currentTarget.value;

    console.log(oldValue, newValue);

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
    } else {
        e.target.value = oldValue;
    }
}

fileTree = new FolderTree(desktop, null);

fileTree.render(treeList);

browsePathsBtn.onclick = (e) => {
    let win = remote.getCurrentWindow();
    dialog.showOpenDialog(win, { properties: ['openDirectory'] }).then(async (dir) => {
        if (!dir.canceled) {
          pathField.value = dir.filePaths[0];
        }
      });
}

refreshBtn.addEventListener("click", () => {
    fileTree.render(treeList);
});