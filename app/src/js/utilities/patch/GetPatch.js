import { unpack } from "./Unpack.js";

const fs = require('fs');
const {ipcRenderer} = require('electron');
const path = require('path');

const configPath = path.normalize(path.join(__dirname, "../../resources/config.json"));
const changeEvent = new Event('change');
const cache = {
    "devmode": null,
    "serverType": "", 
    "fileType": "", 
    "varient": "", 
    "version": "",
    "output": ""
}

//action buttons
let downloadPatch = document.getElementById("downloadPatch");
let downloadManifest = document.getElementById("downloadManifest");
let showDate = document.getElementById("showDate");
let downloadPkg = document.getElementById("downloadPkg");

//settings inputs
let serverType = document.getElementById("serverType");
let fileType = document.getElementById("fileType");
let varient = document.getElementById("varient");
let versionInput = document.getElementById("versionInput");
let output = document.getElementById("output");
let pathsBrowseBtn = document.getElementById("pathsBrowseBtn");

async function initialize() {
    await loadCache();
    serverType.options[0].innerHTML = cache["serverType"];
    fileType.options[0].innerHTML = cache["fileType"];
    varient.options[0].innerHTML = cache["varient"];
    versionInput.value = cache["version"];
    output.value = cache["output"];
    
    initDrops();
    initListeners();
    initSubs();
}

async function loadCache() {
    let res = fs.readFileSync(configPath);
    let jsonObj = await JSON.parse(res);
    let json = jsonObj["getPatch"];

    cache["devmode"] = json["devmode"];
    cache["serverType"] = json["serverType"];
    cache["fileType"] = json["fileType"];
    cache["varient"] = json["varient"];
    cache["version"] = json["version"];
    cache["output"] = json["output"];
}
function updateCache(field, val) {
    let res = fs.readFileSync(configPath);
    let json = JSON.parse(res);
    if (json["getPatch"][field] != val) {
        json["getPatch"][field] = val;
        cache[field] = val;
    
        fs.writeFileSync(configPath, JSON.stringify(json), 'utf-8');
    }
}

function initListeners() {
    pathsBrowseBtn.addEventListener("click", (e) => {
        ipcRenderer.send("showDialogPatch")
    })
}
function initSubs() {
    ipcRenderer.on("getDialogResponsePatch", (event, data) => {
        output.value = data[0];
        output.dispatchEvent(changeEvent);
    });
}
function initDrops() {
    let customSelects = document.getElementsByClassName("custom-select");
    let custSelLen = customSelects.length;

    for (let i = 0; i < custSelLen; i++) {
        let select = customSelects[i].getElementsByTagName("select")[0];
        let selLen = select.length;
        
        let a = document.createElement("DIV");
        a.setAttribute("class", "select-selected");
        a.innerHTML = select.options[select.selectedIndex].innerHTML;
        customSelects[i].appendChild(a);
        
        let b = document.createElement("DIV");
        b.setAttribute("class", "select-items select-hide");

        for (let j = 1; j < selLen; j++) {
            let c = document.createElement("DIV");
            c.innerHTML = select.options[j].innerHTML;

            c.addEventListener("click", function(e) {
                let s = this.parentNode.parentNode.getElementsByTagName("select")[0];
                let sl = s.length;
                let h = this.parentNode.previousSibling;

                for (let i = 0; i < sl; i++) {
                    if (s.options[i].innerHTML == this.innerHTML) {
                        s.selectedIndex = i;
                        h.innerHTML = this.innerHTML;

                        let y = this.parentNode.getElementsByClassName("same-as-selected");
                        let yl = y.length;
                        for (let k = 0; k < yl; k++) {
                            y[k].removeAttribute("class");
                        }

                        this.setAttribute("class", "same-as-selected");

                        break;
                    }
                }

                updateCache(select.id, this.innerHTML);

                h.click();

            });

            b.appendChild(c);

        }

        customSelects[i].appendChild(b);

        a.addEventListener("click", function(e) {
            e.stopPropagation();
            closeAllSelect(this);
            this.nextSibling.classList.toggle("select-hide");
            this.classList.toggle("select-arrow-active");
        });
    }
    function closeAllSelect(elmnt) {
        var x, y, i, xl, yl, arrNo = [];
        x = document.getElementsByClassName("select-items");
        y = document.getElementsByClassName("select-selected");
        xl = x.length;
        yl = y.length;
        for (i = 0; i < yl; i++) {
            if (elmnt == y[i]) {
            arrNo.push(i)
            } else {
            y[i].classList.remove("select-arrow-active");
            }
        }
        for (i = 0; i < xl; i++) {
            if (arrNo.indexOf(i)) {
            x[i].classList.add("select-hide");
            }
        }
    }
    document.addEventListener("click", closeAllSelect);
}


initialize();