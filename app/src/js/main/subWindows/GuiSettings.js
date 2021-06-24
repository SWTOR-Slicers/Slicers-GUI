import { getSetting, updateSettings } from "../../../api/config/settings/Settings.js";

const fs = require("fs");
const { ipcRenderer } = require("electron");
const changeEvent = new Event('change');

let settingsJSON = getSetting();

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
        "path": "",
        "playMinimized": ""
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
    alertNotif.nextElementSibling.innerHTML = alertNotif.options[0].innerHTML;
    alertNotif.nextElementSibling.nextElementSibling.querySelector('.same-as-selected').classList.toggle('same-as-selected');
    alertNotif.nextElementSibling.nextElementSibling.querySelector(`#${alertNotif.options[0].innerHTML}`).classList.toggle('same-as-selected');

    //set tooltip settings
    useLabelTooltips.checked = cache.useLabelTooltips;
    usePathTooltips.checked = cache.usePathTooltips;

    //set audio settings
    ambientMusicEnabled.checked = cache.ambientMusic.enabled;
    if (ambientMusicEnabled.checked) {
        ambientMusicSelectContainer.style.display = '';
        audioDisCont.style.display = '';
    } else {
        ambientMusicSelectContainer.style.display = 'none';
        audioDisCont.style.display = 'none';
    }

    ambientMusicSelect.options[0].innerHTML = cache.ambientMusic.selected;
    ambientMusicSelect.nextElementSibling.innerHTML = ambientMusicSelect.options[0].innerHTML;
    ambientMusicSelect.nextElementSibling.nextElementSibling.querySelector('.same-as-selected').classList.toggle('same-as-selected');
    ambientMusicSelect.nextElementSibling.nextElementSibling.querySelector(`#${ambientMusicSelect.options[0].innerHTML}`).classList.toggle('same-as-selected');
    
    if (cache.ambientMusic.selected == "Custom") {
        musicPathInput.value = cache.ambientMusic.path;
        customMusicCont.style.display = '';
    }
    playWhenMin.checked = cache['ambientMusic']['playMinimized'];
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
        const data = [parent, field];
        cache[parent][field] = value;
        if (changedFields.filter(e => e.toString() === data.toString()).length == 1) {
            changedFields.splice(changedFields.indexOf(data), 1);
        } else {
            changedFields.push(data);
        }
    } else {
        cache[field] = value;
        if (changedFields.includes(field)) changedFields.splice(changedFields.indexOf(field), 1); else changedFields.push(field);
    }
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
    saveAll.addEventListener('click', async (e) => { 
        await updateSettings(cache); 

        ipcRenderer.send('settingsSaved', [changedFields, cache]); 
        changedFields = []; 
        
        saveAll.classList.add('disabled'); 
        cancelAll.classList.add('disabled'); 
        saveAll.blur();
    });
    cancelAll.addEventListener('click', (e) => { cancelModalBackground.style.display = ''; });

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
    playWhenMin.addEventListener('click', (e) => { updateCache('playMinimized', playWhenMin.checked, 'ambientMusic'); });

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
    confirmCancel.addEventListener('click', (e) => {
        ipcRenderer.send('settingsCanceled');
        
        cancelModalBackground.style.display = 'none';

        saveAll.classList.add('disabled');
        cancelAll.classList.add('disabled');
        cancelAll.blur();
    });
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