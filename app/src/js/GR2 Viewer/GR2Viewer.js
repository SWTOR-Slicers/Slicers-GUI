//import * as THREE from '../../../node_modules/three/build/three.module.js';
import {FolderTree} from "./FolderTree.js";

const os = require('os');

const homedir = os.homedir();
const desktop = `${homedir}\\Desktop`;

let treeList = document.getElementById("treeList");


let defaultTree = new FolderTree(desktop, null)

defaultTree.render(treeList);