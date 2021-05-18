//import * as THREE from '../../../node_modules/three/build/three.module.js';
import {FolderTree} from "./FolderTree.js";

const os = require('os');

const homedir = os.homedir();
const desktop = `${homedir}\\Desktop`;

let treeList = document.getElementById("treeList");
let backArrowBtn = document.getElementById("backArrowBtn");
let fowardArrowBtn = document.getElementById("fowardArrowBtn");
let moveUpArrowBtn = document.getElementById("moveUpArrowBtn");
let refreshBtn = document.getElementById("refreshBtn");


let fileTree = new FolderTree(desktop, null)

fileTree.render(treeList);

refreshBtn.addEventListener("click", () => {
    fileTree.render(treeList);
});