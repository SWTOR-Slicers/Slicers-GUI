const { ipcRenderer } = require("electron");

//DOM elements
const alertNotif = document.getElementById('alertNotif');

const useLabelTooltips = document.getElementById('useLabelTooltips');

const usePathTooltips = document.getElementById('usePathTooltips');

const ambientMusicEnabled = document.getElementById('ambientMusicEnabled');
const ambientMusicSelectContainer = document.getElementById('ambientMusicSelectContainer');
const ambientMusicSelect = document.getElementById('ambientMusicSelect');

const saveAll = document.getElementById('saveAll');
const cancelAll = document.getElementById('cancelAll');


const cache = {
    "alerts": "",
    "useLabelTooltips": "",
    "usePathTooltips": "",
    "ambientMusic": {
        "enabled": "",
        "path": ""
    }
};
let changedFields = [];

async function loadCache() {

}

function updateCache(field, value) {

}

function init() {
    loadCache();
    initListeners();
}
function initListeners() {
    saveAll.onclick = (e) => {
        ipcRenderer.send('settingsSaved', [cache, changedFields]);
        changedFields = [];
    }
    cancelAll.onclick = (e) => {
        //TODO: make a modal pop up to confirm
        //if confirmed, send 'settingsCanceled' with ipcRenderer
    }
}
function initSubs() {

}


init();