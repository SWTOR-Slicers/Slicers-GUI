import { getSetting } from '../../api/config/settings/Settings.js';

const {ipcRenderer} = require('electron');

let settingsJSON = getSetting();
let alertType = settingsJSON.alerts;

export function updateAlertType(type) {
    alertType = type;
}

export function log(message, type=null) {
    ipcRenderer.send("logToMain", message);
    if (type) {
        if (alertType == 'All' || (alertType == 'Alert' && (type == 'alert' || type == 'error'))) {
            const alertElem = document.getElementsByTagName('log-alert')[0];
            alertElem.setAttribute('type', type);
            alertElem.setAttribute('visible', "true");
        }
    }
}