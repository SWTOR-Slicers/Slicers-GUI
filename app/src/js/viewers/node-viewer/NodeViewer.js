import { currentNode } from "./GomTree.js";
import { log } from "../../universal/Logger.js";
import { resourcePath, sourcePath } from "../../../api/config/resource-path/ResourcePath.js";
import { addTooltip, updateTooltipEvent } from "../../universal/Tooltips.js";
import { RenderDomFactory } from "../../classes/RenderDom.js";

// Node.js imports
const fs = require("fs");
const path = require("path");

// DOM Elements
const viewerWindow = document.getElementById('viewerWindow');
const fileTreeContainer = document.getElementById('fileTreeContainer');
const treeList = document.getElementById('treeList');
const leftDrag = document.getElementById('leftDrag');
let leftResize = false;

const viewContainer = document.getElementById('viewContainer');
const viewDisplay = viewContainer.firstElementChild;

let rightResize = false;
const rightDrag = document.getElementById('rightDrag');
const dataViewContainer = document.getElementById('dataViewContainer');
const dataContainer = document.getElementById('dataContainer');

const fqnField = document.getElementById('fqnField');
const exportNode = document.getElementById('exportNode');
const outputField = document.getElementById('outputField');
const extrFormat = document.getElementById('extrFormat');
const loadPrototypeNodes = document.getElementById('loadPrototypeNodes');

const bulkExtrProg = document.getElementById('progressBar__bulkExtr');

// Constants
let GTree;
let bulkExtrWorker;
const configPath = path.normalize(path.join(resourcePath, "config.json"));
const cache = {
    "output": "",
    "loadPrototypes": false,
    "outputType": "raw"
}

function bulkCallback(targetFqn) {
    bulkExtrWorker.postMessage({
        "message": "extractSubtree",
        "data": {
            "outputDir": cache['output'],
            "outputType": cache['outputType'],
            "targetFqn": targetFqn
        }
    })
}

function initBulkWorker() {
    bulkExtrWorker  = new Worker(path.join(sourcePath, "js", "viewers", "node-viewer", "BulkExtractWorker.js"), {
        type: "module"
    });

    bulkExtrWorker.onerror = (e) => { console.log(e); throw new Error(`${e.message} on line ${e.lineno}`); }
    bulkExtrWorker.onmessageerror = (e) => { console.log(e); throw new Error(`${e.message} on line ${e.lineno}`); }
    bulkExtrWorker.onmessage = (e) => {
        switch (e.data.message) {
            case "complete":
                // make progress bar green
                bulkExtrProg.classList.add('complete');
                log("Node bulk extraction complete", 'info');
                setTimeout(() => {
                    bulkExtrProg.classList.remove('complete');
                    bulkExtrProg.style.width = undefined;
                }, 5000)
                break;
            case "progress":
                // update progress bar
                bulkExtrProg.style.width = `${e.data.data.loaded / e.data.data.total * 100}%`;
                break;
        }
    }

    bulkExtrWorker.postMessage({
        "message": "init",
        "data": resourcePath
    });
}

async function loadDOM() {
    RenderDomFactory.getDom(["nodes"], resourcePath);
    globalThis.DOM = RenderDomFactory.DOM;
    GTree = globalThis.DOM.gomTree;
    GTree.initRenderer(treeList, viewDisplay, dataContainer);
    GTree.bulkCallback = bulkCallback;
    
    globalThis.DOM.hook({
        assetHooks: {
            assetsProgress: (progress) => {},
            assetsComplete: () => {}
        },
        gomHooks: {
            domUpdate: (progress) => {
                bulkExtrWorker.postMessage({
                    "message": "setDOM",
                    "data": globalThis.DOM._dom
                });
            },
            nodesUpdate: (progress, data) => {
                bulkExtrWorker.postMessage({
                    "message": "nodesProgress",
                    "data": data
                });
                globalThis.DOM.gomTree.nodeTree.resizeFull();
                globalThis.DOM.gomTree.nodeTree.redraw();
                document.getElementById('numBucketsLeft').innerHTML = 500 - globalThis.DOM.gomTree.loadedBuckets;
                if (globalThis.DOM.gomTree.loadedBuckets === 500) {
                    document.getElementById('numBucketsLeft').innerHTML = "Done";
                    setTimeout(() => {
                        document.getElementById('numBucketsLeft').innerHTML = "";
                    }, 2000);
                }
            },
            protosUpdate: (progress, data) => {
                bulkExtrWorker.postMessage({
                    "message": "nodesProgress",
                    "data": data
                });
                if (loadPrototypeNodes.checked) {
                    globalThis.DOM.gomTree.nodeTree.resizeFull();
                    globalThis.DOM.gomTree.nodeTree.redraw();
                }
            }
        },
        flushHook: () => {
            treeList.innerHTML = "";
            viewDisplay.innerHTML = "";
            dataContainer.innerHTML = "";

            GTree = globalThis.DOM.gomTree;
            GTree.initRenderer(treeList, viewDisplay, dataContainer);
        }
    });
}

async function init() {
    await loadCache();
    outputField.value = cache['output'];
    loadPrototypeNodes.checked = cache['loadPrototypes'];
    extrFormat.options[0].innerHTML = cache['outputType'];
    extrFormat.nextElementSibling.innerHTML = extrFormat.options[0].innerHTML;
    extrFormat.nextElementSibling.nextElementSibling.querySelector('.same-as-selected').classList.toggle('same-as-selected');
    extrFormat.nextElementSibling.nextElementSibling.querySelector(`#${extrFormat.options[0].innerHTML}`).classList.toggle('same-as-selected');
    
    initListeners();
    initBulkWorker();
    loadDOM();
}

async function loadCache() {
    let res = fs.readFileSync(configPath);
    let jsonObj = await JSON.parse(res);
    let json = jsonObj["nodeViewer"];

    cache["loadPrototypes"] = json["loadPrototypes"];
    cache["outputType"] = json["outputType"];

    if (json["output"] == "" || !fs.existsSync(json["output"])) {
        const defaultPath = path.join(jsonObj["outputFolder"], 'nodes');
        if (!fs.existsSync(defaultPath)) {
            fs.mkdirSync(defaultPath);
        }
        updateCache('output', defaultPath);
        cache["output"] = defaultPath
    } else {
        cache["output"] = json["output"];
    }
}

function updateCache(field, val) {
    const shouldUpdate = (field == "output") ? fs.existsSync(val) : true; 
    if (shouldUpdate) {
        let res = fs.readFileSync(configPath);
        let json = JSON.parse(res);
        if (json["nodeViewer"][field] != val) {
            json["nodeViewer"][field] = val;
            cache[field] = val;
        
            fs.writeFileSync(configPath, JSON.stringify(json, null, '\t'), 'utf-8');
        }

        if (field == "output") {
            outputField.dispatchEvent(updateTooltipEvent);
        }
    } else {
        output.value = cache["output"];
    }
}

function initListeners() {
    leftDrag.addEventListener('mousedown', (e) => { leftResize = true; });
    rightDrag.addEventListener('mousedown', (e) => { rightResize = true; });
    document.addEventListener('mouseup', (e) => {
        if (leftResize) leftResize = false;
        if (rightResize) rightResize = false;
    });
    document.addEventListener('mousemove', (e) => {
        if (leftResize) {
            let changePercent = ((e.clientX) / viewerWindow.clientWidth) * 100;
            let existingIncr = dataViewContainer.clientWidth / viewerWindow.clientWidth * 100;
            fileTreeContainer.style.width = `${changePercent}%`;
            viewContainer.style.width = `${100 - changePercent - existingIncr}%`;
        } else if (rightResize) {
            let changePercent = ((e.clientX) / viewerWindow.clientWidth) * 100;
            let existingIncr = fileTreeContainer.clientWidth / viewerWindow.clientWidth * 100;
            changePercent -= existingIncr;
            viewContainer.style.width = `${changePercent}%`;
            dataViewContainer.style.width = `${100 - changePercent - existingIncr}%`;
        }
    });
    fqnField.addEventListener('change', (e) => {
        if (fqnField.value != "") {
            const found = GTree.renderNodeByFQN(fqnField.value);
            if (found) {
                log("Found node. It has been opened in the viewer.", "info");
            } else {
                log("Unable to find a node with the given fqn. Check your input for possible typos.", "alert");
            }
        }
    });
    exportNode.addEventListener('click', async (e) => {
        if (currentNode) {
            const res = currentNode.node.extract(cache['output'], cache['outputType']);
            if (res == 0) {
                log(`Sucessfully extracted node to a .${type == "raw" ? "node" : type} file`, 'info');
            } else if (res == 1) {
                log("Error reading the node data: data is null.", "error");
            } else {
                log("Invalid node extract path.", "error");
            }
        }
    });
    extrFormat.clickCallback = (e) => {
        updateCache('outputType', e.currentTarget.innerHTML);
        GTree.outputType = cache['outputType'];
    }
    loadPrototypeNodes.addEventListener('click', (e) => {updateCache('loadPrototypes', loadPrototypeNodes.checked); });
    outputField.addEventListener('change', (e) => {
        updateCache('output', outputField.value);
        GTree.outputDir = cache['output'];
    });
}

init();