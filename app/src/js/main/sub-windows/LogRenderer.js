const { ipcRenderer } = require('electron');
const logDisplay = document.getElementById("logDisplay");

function initialize() {
    initSubs();

    ipcRenderer.send('getPoppedLoggerData', "");
}

function initSubs() {
    ipcRenderer.on('recieveLoggerData', (event, data) => {
        for (const msg of data) {
            log(msg);
        }
    });
    ipcRenderer.on('displayLogData', (event, data) => {
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