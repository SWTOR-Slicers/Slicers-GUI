import { getSetting } from '../../api/config/settings/Settings.js';

const {ipcRenderer} = require('electron');

let settingsJSON = getSetting();
let alertType = settingsJSON.alerts;
/**
 * Updates the alert types that trigger the alert popup.
 * @param  {String} type String representing the setting value.
 */
export function updateAlertType(type) {
    alertType = type;
}

/**
 * Logs the spefied message to the logger, displaying an alert popup.
 * @param  {String} message Message to display in Logger.
 * @param  {String} [type=null] Alert type of the given message.
 */
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