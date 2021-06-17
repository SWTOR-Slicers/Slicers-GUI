const {ipcRenderer} = require('electron');

export function log(message, type=null) {
    ipcRenderer.send("logToMain", message);
    if (type) {
        const alertElem = document.getElementsByTagName('log-alert')[0];
        alertElem.setAttribute('type', type);
        alertElem.setAttribute('visible', "true");
    }
}