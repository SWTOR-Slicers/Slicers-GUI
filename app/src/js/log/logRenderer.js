const {ipcRenderer} = require('electron');
const logDisplay = document.getElementById("logDisplay");

function initialize() {
    initSubs();
}

function initSubs() {
    ipcRenderer.on('recieveLoggerData', (data) => {
        logDisplay.parentElement.innerHTML = data;
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