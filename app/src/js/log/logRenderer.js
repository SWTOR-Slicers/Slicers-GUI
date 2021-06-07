const ipc = window.api;
const logDisplay = document.getElementById("logDisplay");

function initialize() {
    initSubs();

    ipc.send('getPoppedLoggerData', "");
}

function initSubs() {
    ipc.receive('recieveLoggerData', (data) => {
        console.log(data);
        for (const msg of data) {
            log(msg);
        }
    });
    ipc.receive('displayLogData', (data) => {
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