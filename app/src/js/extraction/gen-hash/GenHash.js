const { ipcRenderer } = require("electron");

//DOM Variables
const hashTypeCont = document.getElementById('hashTypeCont');

//buttons
const genHashes = document.getElementById('genHashes');
const cancelGen = document.getElementById('cancelHashGen');

//Consts
const hashTypes = [
    "All", 
    "AMX",
    "BNK",
    "CNV",
    "DAT",
    "DYN",
    "EPP",
    "FXSPEC",
    "GR2",
    "HYD",
    "ICONS",
    "MAT",
    "MISC",
    "MISC_WORLD",
    "PLC",
    "PRT",
    "SDEF",
    "STB",
    "XML"
];
const checkedTypes = {};

function init() {
    for (const hType of hashTypes) {
        const typeCont = genEntr(hType);
        hashTypeCont.appendChild(typeCont);
    }
    initListeners();
}

function initListeners() {
    const chkbxs = document.querySelectorAll('input');
    const allChk = document.getElementById('AllChk');

    for (const box of chkbxs) {
        checkedTypes[box.name] = box.checked;
        if (box.id !== "AllChk") {
            box.addEventListener('change', (e) => {
                const elem = e.currentTarget;
                checkedTypes[elem.name] = elem.checked;
                if (!elem.checked && allChk.checked) {
                    allChk.checked = false;
                }

                if (getChecked().length == 0) {
                    genHashes.classList.add('disabled');
                } else {
                    genHashes.classList.remove('disabled');
                }
            });
        } else {
            allChk.addEventListener('change', (e) => {
                const elem = e.currentTarget;
                checkedTypes[elem.name] = elem.checked;
                for (const b of chkbxs) {
                    if (b.id !== "AllChk") {
                        b.checked = elem.checked;
                    }
                }

                if (getChecked().length == 0) {
                    genHashes.classList.add('disabled');
                } else {
                    genHashes.classList.remove('disabled');
                }
            });
        }
    }

    cancelGen.addEventListener('click', (e) => { ipcRenderer.send('cancelHashGen', ''); });
    genHashes.addEventListener('click', (e) => { ipcRenderer.send('genHashes', [getChecked()]); });
}

//util funcs
function genEntr(hashType) {
    const famCont = document.createElement('div');
    famCont.className = "hash-type";
    famCont.innerHTML = `<input name="${hashType}" id="${hashType}Chk" is="check-box" checked></input>`;

    const lbl = document.createElement('label');
    lbl.className = "hash-type-label";
    lbl.for = `${hashType}`;
    lbl.innerHTML = `${hashType}`;
    famCont.appendChild(lbl);

    return famCont
}

function getChecked() {
    const checked = [];
    const chkbxs = document.querySelectorAll('input');

    for (const box of chkbxs) {
        if (box.checked) {
            checked.push(box.name);
        }
    }

    return checked;
}

init();