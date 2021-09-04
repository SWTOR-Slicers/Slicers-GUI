import { GomTree, nodesByFqn, nodeFolderSort, currentNode } from "./GomTree.js";
import { log } from "../../universal/Logger.js";
import { sourcePath, resourcePath } from "../../../api/config/resource-path/ResourcePath.js";
import { NodeEntr } from "../../classes/Node.js";
import { addTooltip, removeTooltip, updateTooltipEvent } from "../../universal/Tooltips.js";

// Node.js imports
const { ipcRenderer } = require("electron");
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

// Constants
const GTree = new GomTree(treeList, viewDisplay, dataContainer);
const configPath = path.normalize(path.join(resourcePath, "config.json"));
const cache = {
    "output": "",
    "loadPrototype": false,
    "outputType": "raw"
}
let worker;

async function init() {
    await loadCache();
    outputField.value = cache['output'];
    loadPrototypeNodes.checked = cache['loadPrototype'];
    extrFormat.options[0].innerHTML = cache['outputType']
    extrFormat.nextElementSibling.innerHTML = extrFormat.options[0].innerHTML;
    extrFormat.nextElementSibling.nextElementSibling.querySelector('.same-as-selected').classList.toggle('same-as-selected');
    extrFormat.nextElementSibling.nextElementSibling.querySelector(`#${extrFormat.options[0].innerHTML}`).classList.toggle('same-as-selected');
    
    initListeners();
    initSubs();
    initWorker();
    initGomTree();
}

async function loadCache() {
    let res = fs.readFileSync(configPath);
    let jsonObj = await JSON.parse(res);
    let json = jsonObj["nodeViewer"];

    cache["loadPrototype"] = json["loadPrototype"];
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
    fqnField.addEventListener('change', (e) => { if (fqnField.value != "") GTree.getNodeByFQN(fqnField.value); });
    exportNode.addEventListener('click', (e) => { if (currentNode) currentNode.extract(cache['output'], cache['outputType']); });
    extrFormat.clickCallback = (e) => { updateCache('outputType', e.currentTarget.innerHTML); }
    loadPrototypeNodes.addEventListener('click', (e) => { updateCache('loadPrototype', loadPrototypeNodes.checked); });
    outputField.addEventListener('change', (e) => { updateCache('output', outputField.value); });
}

function initWorker() {
    worker = new Worker(path.join(sourcePath, "js", "viewers", "node-viewer", "NodeWorker.js"), {
        type: "module"
    });
    worker.postMessage({
        "message": "init",
        "data": resourcePath
    });
    worker.onmessage = (e) => {
        switch (e.data.message) {
            case "NODES":
                for (const n of e.data.data) {
                    const node = new NodeEntr(n.node, n.torPath);
                    GTree.addNode(node);
                }
                GTree.nodeTree.loadedBuckets++;
                nodesByFqn.$F.sort(nodeFolderSort);
                GTree.nodeTree.resizefull();
                GTree.nodeTree.redraw();
                document.getElementById('numBucketsLeft').innerHTML = 500 - GTree.nodeTree.loadedBuckets;
                if (GTree.nodeTree.loadedBuckets === 500) {
                    document.getElementById('numBucketsLeft').innerHTML = "Done";
                    setTimeout(() => {
                        document.getElementById('numBucketsLeft').innerHTML = "";
                    }, 3000)
                }
                break;
            case "decompressIonic":
                const retPath = ipcRenderer.sendSync('decompressIonic', [e.data.data]);
                worker.postMessage({
                    "message": 'decompressCompl',
                    "data": retPath
                });
                break;
        }
    }
}

function initSubs() {
    ipcRenderer.on('nodeTorPath', (event, data) => {
        worker.postMessage({
            "message": 'loadNodes',
            "data": data[0]
        });
    });
    ipcRenderer.on('errorPathNotExist', (event, data) => { log("The required .tor file is not in your assets directory.", "error"); });
    ipcRenderer.on('nodeReadComplete', (event, data) => {
        if (data[0] == 0) {
            log("Node names generated.", "info");
        } else {
            log("Error generating node names.", "error");
        }
    });
}

function initGomTree() {
    ipcRenderer.send('readAllNodes');
}

init()