import { resourcePath } from "../../../api/config/resourcePath/ResourcePath.js";
import { settingsJSON, updateSettings } from "../../../api/config/settings/Settings.js";

const fs = require("fs");
const { ipcRenderer } = require("electron");
const changeEvent = new Event('change');

//DOM elements

//Accessibility settings
const alertNotif = document.getElementById('alertNotif');

const useLabelTooltips = document.getElementById('useLabelTooltips');

const usePathTooltips = document.getElementById('usePathTooltips');

//Sound Settings
const ambientMusicEnabled = document.getElementById('ambientMusicEnabled');
const ambientMusicSelectContainer = document.getElementById('ambientMusicSelectContainer');
const ambientMusicSelect = document.getElementById('ambientMusicSelect');
const audioDisCont = document.getElementById('audioDisCont');
const playWhenMin = document.getElementById('playWhenMin');

const customMusicCont = document.getElementById('customMusicCont');
const musicPathInput = document.getElementById('musicPathInput');
const musicFolderUpload = document.getElementById('musicFolderUpload');
const musicFileUpload = document.getElementById('musicFileUpload');

//change btns
const saveAll = document.getElementById('saveAll');
const cancelAll = document.getElementById('cancelAll');

//cancel modal
const cancelModalBackground = document.getElementById('cancelModalBackground');
const confirmCancel = document.getElementById('confirmCancel');
const cancelCancel = document.getElementById('cancelCancel');

const cache = {
    "alerts": "",
    "useLabelTooltips": "",
    "usePathTooltips": "",
    "ambientMusic": {
        "enabled": "",
        "selected": "",
        "path": ""
    }
};
let changedFields = [];

async function loadCache() {
    cache.alerts = settingsJSON.alerts;
    cache.useLabelTooltips = settingsJSON.useLabelTooltips;
    cache.usePathTooltips = settingsJSON.usePathTooltips;
    cache.ambientMusic = settingsJSON.ambientMusic;

    //set allert settings
    alertNotif.options[0].innerHTML = cache.alerts;

    //set tooltip settings
    useLabelTooltips.checked = cache.useLabelTooltips;
    usePathTooltips.checked = cache.usePathTooltips;

    //set audio settings
    ambientMusicEnabled.checked = cache.ambientMusic.enabled;
    ambientMusicSelect.options[0].innerHTML = cache.ambientMusic.selected;
    if (cache.ambientMusic.selected == "Custom") {
        musicPathInput.value = cache.ambientMusic.path;
    }
    playWhenMin.checked = cache['ambientMusic']['selected'];
}
function updateCache(field, value, parent=null) {
    if (field == "selected") {
        if (value == "Custom") {
            customMusicCont.style.display = '';
        } else if (cache['ambientMusic']['selected'] == "Custom") {
            customMusicCont.style.display = 'none';
        }
    }
    if (parent) {
        cache[parent][field] = value;
    } else {
        cache[field] = value;
    }
    if (changedFields.includes(field)) changedFields.splice(changedFields.indexOf(field), 1); else changedFields.push(field);
    if (changedFields.length > 0) {
        saveAll.classList.remove('disabled');
        cancelAll.classList.remove('disabled');
    } else {
        saveAll.classList.add('disabled');
        cancelAll.classList.add('disabled');
    }
}

function init() {
    loadCache();
    initSubs();
    initListeners();
}
function initListeners() {
    //change buttons
    saveAll.addEventListener('click', (e) => { updateSettings(cache); ipcRenderer.send('settingsSaved', [changedFields]); changedFields = []; });
    cancelAll.addEventListener('click', (e) => {
        cancelModalBackground.style.display = '';
    });

    //alerts
    alertNotif.clickCallback = (e) => { updateCache('alerts', e.currentTarget.innerHTML); }

    //tooltips
    useLabelTooltips.addEventListener('click', (e) => { updateCache('useLabelTooltips', useLabelTooltips.checked); });
    usePathTooltips.addEventListener('click', (e) => { updateCache('usePathTooltips', usePathTooltips.checked); });

    //Sound Settings
    ambientMusicEnabled.addEventListener('click', (e) => {
        updateCache('enabled', ambientMusicEnabled.checked, 'ambientMusic');
        if (ambientMusicEnabled.checked) {
            ambientMusicSelectContainer.style.display = '';
            audioDisCont.style.display = '';
        } else {
            ambientMusicSelectContainer.style.display = 'none';
            audioDisCont.style.display = 'none';
        }
    });
    ambientMusicSelect.clickCallback = (e) => { updateCache('selected', e.currentTarget.innerHTML, 'ambientMusic'); }
    playWhenMin.addEventListener('click', (e) => { updateCache('playMinimized', playWhenMin.checked); });

    musicPathInput.addEventListener('change', (e) => {
        if (fs.existsSync(e.currentTarget.value)) {
            updateCache('path', e.currentTarget.value, 'ambientMusic');
        } else {
            e.currentTarget.value = cache['ambientMusic']['path'];
        }
    });
    musicFileUpload.addEventListener('click', (e) => { ipcRenderer.send('openMusicFileDialog'); });
    musicFolderUpload.addEventListener('click', (e) => { ipcRenderer.send('openMusicFolderDialog'); });


    //cancel modal
    confirmCancel.addEventListener('click', (e) => { ipcRenderer.send('settingsCanceled'); });
    cancelCancel.addEventListener('click', (e) => { cancelModalBackground.style.display = 'none'; });
}
function initSubs() {
    ipcRenderer.on('musicFileResponse', (event, data) => {
        const path = data[0];
        if (path != '') {
            musicPathInput.value = path;
            musicPathInput.dispatchEvent(changeEvent);
        }
    });
    ipcRenderer.on('musicFolderResponse', (event, data) => {
        const path = data[0];
        if (path != '') {
            musicPathInput.value = path;
            musicPathInput.dispatchEvent(changeEvent);
        }
    });
}


init();