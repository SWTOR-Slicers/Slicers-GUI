const {ipcRenderer} = require('electron');
const logDisplay = document.getElementById("logDisplay");

function initialize() {
    initSubs();

    ipcRenderer.send('getPoppedLoggerData', "");
}

function initSubs() {
    ipcRenderer.on('recieveLoggerData', (data) => {
        console.log(data);
        const msgs = data.split('\n');
        for (const msg of msgs) {
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