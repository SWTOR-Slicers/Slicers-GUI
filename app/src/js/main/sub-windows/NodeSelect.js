const { ipcRenderer } = require("electron");

//DOM Variables
const nodeFamCont = document.getElementById('nodeFamCont');

//buttons
const extrNodes = document.getElementById('extrNodes');
const cancelExtr = document.getElementById('cancelExtr');

//Consts
const nodeFamilies = ["All", "_misc", "abl", "ach", "ami", "apc", "apn", "apt", "cam", "cdx", "chase", "class", "cnd", "cpt", "death", "dec", "dth", "dyn", "dynamic", "emt", "enc", "epp", "freelook", "hyd", "ipp", "itm", "lky", "locked", "mpn", "mrp", "nco", "npc", "npp", "padlock", "pcs", "phs", "pkg", "plc", "pth", "qst", "rdd", "sc", "schem", "sniper", "spc", "spn", "spvp", "stg", "svy", "tal", "tax", "tl", "world", "other"];
const checkedNodes = {};

function init() {
    for (const nFam of nodeFamilies) {
        const famCont = genEntr(nFam);
        nodeFamCont.appendChild(famCont);
    }
    initListeners();
}

function initListeners() {
    const chkbxs = document.querySelectorAll('input');
    const allChk = document.getElementById('AllChk');

    for (const box of chkbxs) {
        checkedNodes[box.name] = box.checked;
        if (box.id !== "AllChk") {
            box.addEventListener('change', (e) => {
                const elem = e.currentTarget;
                checkedNodes[elem.name] = elem.checked;
                if (!elem.checked && allChk.checked) {
                    allChk.checked = false;
                }

                if (getChecked().length == 0) {
                    extrNodes.classList.add('disabled');
                } else {
                    extrNodes.classList.remove('disabled');
                }
            });
        } else {
            allChk.addEventListener('change', (e) => {
                const elem = e.currentTarget;
                checkedNodes[elem.name] = elem.checked;
                for (const b of chkbxs) {
                    if (b.id !== "AllChk") {
                        b.checked = elem.checked;
                    }
                }

                if (getChecked().length == 0) {
                    extrNodes.classList.add('disabled');
                } else {
                    extrNodes.classList.remove('disabled');
                }
            });
        }
    }

    cancelExtr.addEventListener('click', (e) => { ipcRenderer.send('cancelNodeExtr', ''); });
    extrNodes.addEventListener('click', (e) => { ipcRenderer.send('extractNodes', [getChecked()]); });
}

//util funcs
function genEntr(nodeFam) {
    const famCont = document.createElement('div');
    famCont.className = "node-family";
    famCont.innerHTML = `<input name="${nodeFam}" id="${nodeFam}Chk" is="check-box" checked></input>`;

    const lbl = document.createElement('label');
    lbl.className = "node-family-label";
    lbl.for = `${nodeFam}`;
    lbl.innerHTML = `${nodeFam}`;
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