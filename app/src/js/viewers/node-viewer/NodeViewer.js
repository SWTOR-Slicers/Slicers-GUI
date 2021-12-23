import { GomTree, nodesByFqn, nodeFolderSort, currentNode } from "./GomTree.js";
import { log } from "../../universal/Logger.js";
import { sourcePath, resourcePath } from "../../../api/config/resource-path/ResourcePath.js";
import { NodeEntr } from "../../classes/formats/Node.js";
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
    "loadPrototypes": false,
    "outputType": "raw"
}
let worker;
let _dom = null;

async function init() {
    await loadCache();
    outputField.value = cache['output'];
    loadPrototypeNodes.checked = cache['loadPrototypes'];
    extrFormat.options[0].innerHTML = cache['outputType']
    extrFormat.nextElementSibling.innerHTML = extrFormat.options[0].innerHTML;
    extrFormat.nextElementSibling.nextElementSibling.querySelector('.same-as-selected').classList.toggle('same-as-selected');
    extrFormat.nextElementSibling.nextElementSibling.querySelector(`#${extrFormat.options[0].innerHTML}`).classList.toggle('same-as-selected');
    
    initWorker();
    initListeners();
    initSubs();
    initGomTree();
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
    fqnField.addEventListener('change', (e) => { if (fqnField.value != "") GTree.getNodeByFQN(fqnField.value); });
    exportNode.addEventListener('click', (e) => {
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
    extrFormat.clickCallback = (e) => { updateCache('outputType', e.currentTarget.innerHTML); }
    loadPrototypeNodes.addEventListener('click', (e) => { updateCache('loadPrototypes', loadPrototypeNodes.checked); });
    outputField.addEventListener('change', (e) => { updateCache('output', outputField.value); });
}

const decomprFunc = (params) => {
    return ipcRenderer.sendSync('decompressZlib', [resourcePath, params]);
}

function initWorker() {
    worker = new Worker(path.join(sourcePath, "js", "viewers", "node-viewer", "NodeWorker.js"), {
        type: "module"
    });
    worker.onerror = (e) => {
        console.log(e);
        throw new Error(`${e.message} on line ${e.lineno}`);
    }
    worker.onmessageerror = (e) => {
        console.log(e);
        throw new Error(`${e.message} on line ${e.lineno}`);
    }
    worker.onmessage = (e) => {
        switch (e.data.message) {
            case "DomElements":
                _dom = e.data.data;
                break;
            case "NODES":
                for (const n of e.data.data) {
                    const node = new NodeEntr(n.node, n.torPath, _dom, decomprFunc);
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
                    }, 2000);
                }
                break;
            case "PROTO":
                for (const n of e.data.data.nodes) {
                    const testProto = new NodeEntr(n.node, n.torPath, _dom, decomprFunc);
                    GTree.addNode(testProto);
                }
                nodesByFqn.$F.sort(nodeFolderSort);
                GTree.nodeTree.resizefull();
                GTree.nodeTree.redraw();
                break;
        }
    }

    worker.postMessage({
        "message": "init",
        "data": resourcePath
    });
}

function initSubs() {
    ipcRenderer.on('nodeTorPath', (event, data) => {
        worker.postMessage({
            "message": 'loadNodes',
            "data": {
                "torFiles": data,
                "loadProts": loadPrototypeNodes.checked
            }
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

init();