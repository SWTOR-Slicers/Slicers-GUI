//import * as THREE from '../../../node_modules/three/build/three.module.js';
import {FolderTree} from "./FolderTree.js";

const path = window.api.path;
const fs = window.api.fs;
const exec = window.api.child_process.exec;
const os = window.api.os;

const homedir = os.homedir();
const desktop = `${homedir}\\Desktop`;

let treeList = document.getElementById("treeList");

let defaultTree = new FolderTree(homedir);
defaultTree.render(treeList);