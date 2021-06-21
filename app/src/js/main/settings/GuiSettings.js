import { resourcePath } from "../../../api/config/resourcePath/ResourcePath.js";
import { settingsJSON, updateSettings } from "../../../api/config/settings/Settings.js";
const { ipcRenderer } = require("electron");

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

const saveAll = document.getElementById('saveAll');
const cancelAll = document.getElementById('cancelAll');


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
    initListeners();
}
function initListeners() {
    //change buttons
    saveAll.addEventListener('click', (e) => { updateSettings(cache); ipcRenderer.send('settingsSaved', [changedFields]); changedFields = []; });
    cancelAll.addEventListener('click', (e) => {
        //TODO: make a modal pop up to confirm
        //if confirmed, send 'settingsCanceled' with ipcRenderer
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
}
function initSubs() {

}


init();