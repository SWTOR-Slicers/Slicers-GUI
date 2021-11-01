import { sourcePath, resourcePath } from "../../../api/config/resource-path/ResourcePath.js";
import { nodesByFqn, nodeFolderSort, StaticGomTree } from "../../viewers/node-viewer/GomTree.js";

const { ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");

//DOM Variables
const hashTypeCont = document.getElementById('hashTypeCont');
const spinner = document.getElementById('spinner');
const progressBar__clientGOM = document.getElementById('progressBar__clientGOM');
const progressBar__baseNodes = document.getElementById('progressBar__baseNodes');
const progressBar__protoNodes = document.getElementById('progressBar__protoNodes');

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
let worker;
let _dom = null;
const GTree = new StaticGomTree();

const decomprFunc = (params) => {
    return ipcRenderer.sendSync('decompressZlib', [resourcePath, params]);
}

function init() {
    for (const hType of hashTypes) {
        const typeCont = genEntr(hType);
        hashTypeCont.appendChild(typeCont);
    }
    initListeners();
    initWorker();
}

function initWorker() {
    worker = new Worker(path.join(sourcePath, "js", "viewers", "node-viewer", "NodeWorker.js"), {
        type: "module"
    });

    worker.onerror = (e) => { console.log(e); throw new Error(`${e.message} on line ${e.lineno}`); }
    worker.onmessageerror = (e) => { console.log(e); throw new Error(`${e.message} on line ${e.lineno}`); }
    worker.onmessage = (e) => {
        switch (e.data.message) {
            case "DomElements":
                _dom = e.data.data;
                progressBar__clientGOM.style.width = '100%';
                break;
            case "NODES":
                for (const n of e.data.data) {
                    const node = new NodeEntr(n.node, n.torPath, _dom, decomprFunc);
                    GTree.addNode(node);
                }
                GTree.nodeTree.loadedBuckets++;
                nodesByFqn.$F.sort(nodeFolderSort);
                progressBar__baseNodes.style.width = `${GTree.nodeTree.loadedBuckets / 500 * 100}%`;
                break;
            case "PROTO":
                for (const n of e.data.data.nodes) {
                    const testProto = new NodeEntr(n.node, n.torPath, _dom, decomprFunc);
                    GTree.addNode(testProto);
                }
                progressBar__protoNodes.style.width = `${e.data.data.numLoaded / e.data.data.total * 100}%`;
                nodesByFqn.$F.sort(nodeFolderSort);
                break;
        }
    }
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

    cancelGen.addEventListener('click', (e) => {
        ipcRenderer.send('cancelHashGen', '');
        document.querySelector('.header-container').innerHTML = 'Select file types to generate';
        hashTypeCont.classList.toggle('hidden');
        genHashes.innerHTML = 'Load Nodes';
    });
    genHashes.addEventListener('click', (e) => {
        if (genHashes.innerHTML == 'Load Nodes') {
            hashTypeCont.classList.toggle('hidden');
            spinner.classList.toggle('hidden');
            document.querySelector('.header-container').innerHTML = 'Loading Nodes...';
            genHashes.classList.toggle('disabled');
        
            worker.postMessage({
                "message": "init",
                "data": resourcePath
            });

            // this is to simulate it completing
            setTimeout(() => {
                document.querySelector('.header-container').innerHTML = 'Loading Complete!';
                spinner.classList.toggle('hidden');
                genHashes.innerHTML = 'Generate';
                genHashes.classList.toggle('disabled');
            }, 5000);
        } else {
            ipcRenderer.send('genHashes', [getChecked()]);
            document.querySelector('.header-container').innerHTML = 'Select file types to generate';
            hashTypeCont.classList.toggle('hidden');
            genHashes.innerHTML = 'Load Nodes';
        }
    });
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