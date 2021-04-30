// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
const ipc = window.api;

let assetPopupBtn = document.getElementById("assetPopupBtn");
let assetTextField = document.getElementById("assetTextField");
assetPopupBtn.addEventListener('click', () => {
    ipc.receive('assetsFolderReply', (data) => {
        processResponse(data, assetTextField, 'assetsFolder');
    });
    ipc.send('showDialog', 'assetsFolder');
});

let outputPopupBtn = document.getElementById("outputPopupBtn");
let outputTextField = document.getElementById("outputTextField");
outputPopupBtn.addEventListener('click', () => {
    ipc.receive('outputFolderReply', (data) => {
        processResponse(data, outputTextField, 'outputFolder');
    });
    ipc.send('showDialog', 'outputFolder');
});

let dataPopupBtn = document.getElementById("dataPopupBtn");
let dataTextField = document.getElementById("dataTextField");
dataPopupBtn.addEventListener('click', () => {
    ipc.receive('dataFolderReply', (data) => {
        processResponse(data, dataTextField, 'dataFolder');
    });
    ipc.send('showDialog', 'dataFolder');
});

async function processResponse(data, elem, param) {
    elem.value = data[0];
}

let extrBtn = document.getElementById("extractionBtn");
let lctBtn = document.getElementById("locateBtn");
let nvBtn = document.getElementById("nodeViewBtn");
nvBtn.addEventListener("click", (e) => {
    ipc.send('runExec', 'nodeViewer');
})
let bcBtn = document.getElementById("bnkConverterBtn");

let logDisplay = document.getElementById("logDisplay");