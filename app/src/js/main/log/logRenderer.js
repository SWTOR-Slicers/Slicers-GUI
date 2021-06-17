const ipcRenderer = window.api;
const {ipcRendererRenderer} = require('electron');
const logDisplay = document.getElementById("logDisplay");

function initialize() {
    initSubs();

    ipcRenderer.send('getPoppedLoggerData', "");
}

function initSubs() {
    ipcRenderer.on('recieveLoggerData', (data) => {
        console.log(data);
        for (const msg of data) {
            log(msg);
        }
    });
    ipcRenderer.on('displayLogData', (data) => {
        log(data);
    });
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