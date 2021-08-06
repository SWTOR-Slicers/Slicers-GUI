//DOM Variables
const nodeFamCont = document.getElementById('nodeFamCont');

//Consts
const nodeFamilies = ["All", "_misc", "abl", "ach", "ami", "apc", "apn", "apt", "cam", "cdx", "chase", "class", "cnd", "cpt", "death", "dec", "dth", "dyn", "dynamic", "emt", "enc", "epp", "freelook", "hyd", "ipp", "itm", "lky", "locked", "mpn", "mrp", "nco", "npc", "npp", "padlock", "pcs", "phs", "pkg", "plc", "pth", "qst", "rdd", "sc", "schem", "sniper", "spc", "spn", "spvp", "stg", "svy", "tal", "tax", "tl", "world", "other"];




function init() {
    for (const nFam of nodeFamilies) {
        const famCont = genEntr(nFam);
        nodeFamCont.appendChild(famCont);
    }
    initListeners();
    initSubs();
}

function initListeners() {

}

function initSubs() {

}

//util funcs
function genEntr(nodeFam) {
    const famCont = document.createElement('div');
    famCont.className = "node-family";
    famCont.innerHTML = `<input name="${nodeFam}Chk" id="${nodeFam}Chk" is="check-box" checked></input>`;

    const lbl = document.createElement('label');
    lbl.className = "node-family-label";
    lbl.for = `${nodeFam}Chk`;
    lbl.innerHTML = `${nodeFam}`;
    famCont.appendChild(lbl);

    return famCont
}

// <div class="node-family">
//     <label for="allChk" class="family-label">All:</label>
//     <input name="allChk" id="allChk" is="check-box" checked>
// </div>

init();