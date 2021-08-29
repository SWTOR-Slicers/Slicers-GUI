import { GomTree, nodesByFqn, nodeFolderSort } from "./GomTree.js";
import { log } from "../../universal/Logger.js";
import { sourcePath } from "../../../api/config/resource-path/ResourcePath.js";
import {NodeEntr} from "../../classes/Node.js";

// Node.js imports
const { ipcRenderer } = require("electron");
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

// Constants
const GTree = new GomTree(treeList, viewDisplay, dataContainer);
let worker;

function init() {
    initCache();
    initListeners();
    initSubs();
    initWorker();
    initGomTree();
}

function initCache() {

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
            GTree.getNodeByFQN(fqnField.value);
        }
    });
}

function initWorker() {
    worker = new Worker(path.join(sourcePath, "js", "viewers", "node-viewer", "NodeWorker.js"), {
        type: "module"
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