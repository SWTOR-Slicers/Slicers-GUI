import {FolderTree} from "./FolderTree.js";

const THREE = require('three');
const os = require('os');

const homedir = os.homedir();
const desktop = `${homedir}\\Desktop`;
const history = [desktop, null, null, null, null, null, null, null, null, null];
let histIdx = 0;

let treeList = document.getElementById("treeList");
let pathField = document.getElementById("pathField");
let browsePathsBtn = document.getElementById("browsePathsBtn");

let backArrowBtn = document.getElementById("backArrowBtn");
let fowardArrowBtn = document.getElementById("fowardArrowBtn");
let moveUpArrowBtn = document.getElementById("moveUpArrowBtn");
let refreshBtn = document.getElementById("refreshBtn");



let fileTree = new FolderTree(desktop, null);

fileTree.render(treeList);

refreshBtn.addEventListener("click", () => {
    fileTree.render(treeList);
});