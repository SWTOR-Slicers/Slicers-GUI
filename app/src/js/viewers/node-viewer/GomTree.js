import { fixDpi } from "../../Util.js";
import { NodeEntr } from "../../classes/formats/Node.js";
import { log } from "../../universal/Logger.js";

const FILETREE_HEIGHT = 16;
const NUM_META_FOLDERS = 2;
const nodesByFqn = {
    "$F": [], //files
    "$O": 2,
    "_misc": {
        "$F": [], //files
        "$O": 0
    },
    getObjectNoLoad: (path) => {
        const components = path.split('.');
        if (components.length > 1) {
            let parent = this;
            let idx = 0;
            for (const c of components) {
                if (idx == components.length - 1) {
                    return parent.$F[components[idx]];
                } else {
                    parent = parent[components[idx]];
                    idx++;
                }
            }
        } else {
            return this.$F[components[0]];
        }
    },
    getObject: (path) => {
        let ret = undefined;
        const components = path.split('.');
        if (components.length > 1) {
            let parent = this;
            let idx = 0;
            for (const c of components) {
                if (idx == components.length - 1) {
                    ret = parent.$F[components[idx]];
                } else {
                    parent = parent[components[idx]];
                    idx++;
                }
            }
        } else {
            ret = this.$F[components[0]];
        }

        if (ret) {
            ret.readNode();
        }

        return ret;
    },
    getObjectsStartingWith: (fam) => {
        let ret = [];
        let path = fam.split(".");
        let parent = this;
        let seg;

        if (path.length > 1) {
            for (let i = 0; i < path.length - 1; i++) {
                parent = parent[path[i]];
            }

            seg = path[path.length - 1];
        } else {
            seg = path[0];
        }
        if (parent[fam]) {
            parent = parent[fam];
            recursiveAdd(fam, parent);
        }

        function recursiveAdd(fam, parent) {
            for (const kvp in Object.entries(parent)) {
                if (kvp[0] != '$O' && kvp[0] != '$F') {
                    recursiveAdd(`${fam}${kvp[0]}.`, kvp[1]);
                }
            }
            for (const entr in parent.$F) {
                ret.push(entr);
            }
        }

        return ret;
    }
};
const protoNodes = {};
let currentNode;

class NodeTree {
    constructor(treeList, renderTarg, dataContainer) {
        this.renderTarg = renderTarg;
        this.dataContainer = dataContainer;

        this.loadedBuckets = 0;
        this.hoverEle = -1;

        this.scroller = document.getElementById('nav_nodes_scroller');
        this.scrollercon = document.getElementById('nav_nodes_scrollercon');
        this.scrollersize = document.getElementById('nav_nodes_scrollersize');
        this.scroller.onscroll = this.redraw;
        this.scroller.onmousemove = this.redraw;
        this.scroller.onmouseout = this.redraw;
        this.scrollercon.onmousedown = this.click;
        this.scrollercon.oncontextmenu = this.contextMenu;
        this.canvas = treeList;
        this.ctx = this.canvas.getContext('2d', {
            alpha: false
        });
        fixDpi(this.canvas);
        this.resizefull();
        this.redraw();
    }
    
    redraw = (e) => {
        this.ctx.translate(0.5, 0.5);
        this.canvas.width = this.scrollersize.offsetWidth * window.devicePixelRatio;
        this.canvas.style.width = `${this.scrollersize.offsetWidth}px`;
        this.canvas.height = this.scrollersize.offsetHeight * window.devicePixelRatio;
        this.canvas.style.height = `${this.scrollersize.offsetHeight}px`;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.ctx.font = 'normal 10pt arial'; //'normal normal 200 10pt Eurofont';
        this.ctx.fillStyle = "#333"
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        if (e) {
            this.hoverEle = 15 - this.scroller.scrollTop + (e.offsetY & 0xFFFFF0)
        }
        if (this.loadedBuckets === 0) {
            this.ctx.fillStyle = 'rgb(255, 255, 255)';
            this.ctx.fillText('Loading...', 170, 26)
        } else {
            this.drawfolder(nodesByFqn, 15 - this.scroller.scrollTop, FILETREE_HEIGHT - this.scroller.scrollLeft, this.scrollersize.offsetHeight)
        }
        this.ctx.translate(-0.5, -0.5);
    }
    
    drawfolder = (folder,heightIn,level,maxHeight) => {
        let height = heightIn;
        const dirs = Object.keys(folder).sort();
        const fl = folder.$F.length;
        for (let i = NUM_META_FOLDERS, l = dirs.length; i < l; i++) {
            if (height > 0 && height - FILETREE_HEIGHT < maxHeight) {
                if (height === this.hoverEle) {
                    this.ctx.fillStyle = 'rgb(71, 71, 71)';
                    this.ctx.fillRect(level + 5, height - 12, 500, FILETREE_HEIGHT)
                }
                this.ctx.fillStyle = '#ffce00';
                if (i > NUM_META_FOLDERS || folder !== nodesByFqn) {
                    // This block adds the vertical dots
                    this.ctx.fillRect(3 + level - 11, height - 14, 1, 5);
                }
                // This block adds the horizontal dots
                this.ctx.fillRect(3 + level - 5, height - 4, 1, 1);
                this.ctx.fillRect(3 + level - 3, height - 4, 1, 1);
                this.ctx.fillRect(3 + level - 1, height - 4, 1, 1);

                // This block makes the squares
                this.ctx.fillRect(3 + level - 15, height - 8, 9, 1);
                this.ctx.fillRect(3 + level - 15, height, 9, 1);
                this.ctx.fillRect(3 + level - 15, height - 7, 1, 7);
                this.ctx.fillRect(3 + level - 7, height - 7, 1, 7);
                this.ctx.fillRect(3 + level - 13, height - 4, 5, 1);

                this.ctx.fillStyle = 'rgb(255, 255, 255)';
                this.ctx.fillText(dirs[i], 5 + level, height)
            }
            const curDir = folder[dirs[i]];
            if (curDir.$O === 2) {
                let prevHeight = height;
                height = this.drawfolder(curDir, height + FILETREE_HEIGHT, level + FILETREE_HEIGHT, maxHeight);
                if (i + 1 < l || fl > 0) {
                    let newHeight = height - 14;
                    if (prevHeight < 0)
                        prevHeight = 0;
                    if (newHeight > maxHeight)
                        newHeight = maxHeight;
                    this.ctx.fillStyle = '#ffce00';
                    for (let j = prevHeight+2; j < newHeight; j ++) {
                        // This adds the vertical dots to open folders
                        this.ctx.fillRect(3 + level - 11, j, 1, (j+1 < newHeight) ? 1 : 5)
                    }
                }
            } else {
                this.ctx.fillStyle = '#ffce00';
                // This makes the minus a plus
                this.ctx.fillRect(3 + level - 11, height - 6, 1, 5);
                height += FILETREE_HEIGHT
            }
        }
        for (let i = 0; i < fl; i++) {
            if (height > 0 && height - FILETREE_HEIGHT < maxHeight) {
                if (height === this.hoverEle) {
                    this.ctx.fillStyle = 'rgb(71, 71, 71)';
                    this.ctx.fillRect(level, height - 12, 500, FILETREE_HEIGHT)
                }
                this.ctx.fillStyle = '#ffce00';
                if (i > 0) {
                    // This block adds missing vertical dots
                    this.ctx.fillRect(3 + level - 11, height - 19, 1, 5);
                }
                // This block adds vertical dots
                this.ctx.fillRect(3 + level - 11, height - 14, 1, 11);

                // This block adds horizontal dots
                this.ctx.fillRect(3 + level - 9, height - 4, 1, 1);
                this.ctx.fillRect(3 + level - 7, height - 4, 1, 1);
                this.ctx.fillRect(3 + level - 5, height - 4, 1, 1);
                this.ctx.fillRect(3 + level - 3, height - 4, 1, 1);
                this.ctx.fillRect(3 + level - 1, height - 4, 1, 1);
                const curFile = folder.$F[i];
                this.ctx.fillStyle = 'rgb(255, 255, 255)';
                this.ctx.fillText(curFile.fileName, 5 + level, height)
            }
            height += FILETREE_HEIGHT
        }
        return height
    }
    
    click = (e) => {
        const clickEle = 15 - this.scroller.scrollTop + (e.offsetY & 0xFFFFF0);
        this.clickfolder(nodesByFqn, 15 - this.scroller.scrollTop, FILETREE_HEIGHT - this.scroller.scrollLeft, clickEle)
    }

    contextMenu = (e) => {
        e.preventDefault();


    }
    
    clickfolder = (folder,heightIn,level,target) => {
        let height = heightIn;
        const dirs = Object.keys(folder).sort();
        const fl = folder.$F.length;
        for (let i = NUM_META_FOLDERS, l = dirs.length; i < l; i++) {
            const curDir = folder[dirs[i]];
            if (height === target) {
                if (curDir.$O === 0)
                    curDir.$F.sort(nodeFolderSort);
                curDir.$O = (curDir.$O === 2) ? 1 : 2;
                this.resizefull();
                this.redraw();
                return 0
            }
            if (curDir.$O === 2) {
                height = this.clickfolder(curDir, height + FILETREE_HEIGHT, level + FILETREE_HEIGHT, target);
                if (height === 0)
                    return 0
            } else {
                height += FILETREE_HEIGHT
            }
        }
        for (let i = 0; i < fl; i++) {
            if (height === target) {
                folder.$F[i].render(this.renderTarg, this.dataContainer, (val) => {
                    currentNode = val;
                });
                return 0
            }
            height += FILETREE_HEIGHT
        }
        return height
    }
    
    resizefull = () => {
        this.scrollercon.style.width = '500px';
        this.scrollercon.style.height = (5 + this.resizedir(nodesByFqn)) + 'px'
    }
    
    resizedir = (folder) => {
        let height = 0;
        const dirs = Object.keys(folder);
        for (let i = NUM_META_FOLDERS, l = dirs.length; i < l; i++) {
            const dir = folder[dirs[i]];
            if (dir.$O === 2) {
                height += this.resizedir(dir)
            }
        }
        height += (dirs.length - NUM_META_FOLDERS + folder.$F.length) * FILETREE_HEIGHT;
        return height
    }
}

class GomTree {
    constructor (treeList, viewContainer, dataContainer) {
        this.viewContainer = viewContainer;
        this.dataContainer = dataContainer;
        this.nodeTree = new NodeTree(treeList, viewContainer, dataContainer);
    }

    /**
     * Adds a node to the Gom tree, and saves the created nodeElem to a dictionary
     * @param {NodeEntr} node A Node object representing the node entry data from the node reader.
     */
    addNode(node) {
        let name = node.fqn;
        let curFolder = nodesByFqn;
        let folderStart = 0;
        let i = 0;
        for (; i < name.length; i++) {
            if (name[i] === '.') {
                const folderName = name.substring(folderStart, i);
                if (folderStart === 0 && i > 8) {
                    curFolder = curFolder._misc
                }
                let tmpFolder = curFolder[folderName];
                if (!tmpFolder) {
                    tmpFolder = Object.create(null);
                    tmpFolder.$F = [];
                    tmpFolder.$O = 0;
                    curFolder[folderName] = tmpFolder
                }
                curFolder = tmpFolder;
                folderStart = i + 1
            }
        }
        node.path = name.substring(0, folderStart);
        const fileName = name.substring(folderStart, i);
        node.fileName = fileName;
        if (curFolder.$O === 0) {
            curFolder.$F.push(node)
        } else {
            let insertIndex = 0;
            for (let j = 0, l = curFolder.$F.length; j < l; j++) {
                if (curFolder.$F[j].fileName <= fileName) {
                    insertIndex++
                } else {
                    break
                }
            }
            curFolder.$F.splice(insertIndex, 0, node)
        }
    }

    getNodeByFQN(fqn) {
        let hasFound = false;
        console.log(nodesByFqn);
        const tree = fqn.split(".");
        if (tree.length > 0) {
            let parent = nodesByFqn;
            for (let i = 0; i < tree.length; i++) {
                const elem = tree[i];
                const fqnObj = parent[elem];
                if (i + 1 == tree.length) {
                    const tNode = parent.$F.find((val, idx) => { return val.fileName == elem; });
                    if (tNode) {
                        hasFound = true
                        tNode.render(this.viewContainer, this.dataContainer, (val) => {
                            currentNode = val;
                        });
                    }
                    break
                } else if (fqnObj) {
                    parent = fqnObj;
                } else {
                    break
                }
            }
        } else {
            const tNode = nodesByFqn.$F.find((val, idx) => { return val.fileName == tree[0]; });
            if (tNode) {
                hasFound = true;
                tNode.render(this.viewContainer, this.dataContainer, (val) => {
                    currentNode = val;
                });
            }
        }
    
        if (!hasFound) {
            log("Unable to find a node with the given fqn. Check your input for possible typos.", "alert");
        }
    }
}

class StaticGomTree {
    constructor () {
        this.loadedBuckets = 0;
    }

    /**
     * Adds a node to the Gom tree, and saves the created nodeElem to a dictionary
     * @param {NodeEntr} node A Node object representing the node entry data from the node reader.
     */
    addNode(node) {
        let name = node.fqn;
        let curFolder = nodesByFqn;
        let folderStart = 0;
        let i = 0;
        for (; i < name.length; i++) {
            if (name[i] === '.') {
                const folderName = name.substring(folderStart, i);
                if (folderStart === 0 && i > 8) {
                    curFolder = curFolder._misc
                }
                let tmpFolder = curFolder[folderName];
                if (!tmpFolder) {
                    tmpFolder = Object.create(null);
                    tmpFolder.$F = [];
                    tmpFolder.$O = 0;
                    curFolder[folderName] = tmpFolder
                }
                curFolder = tmpFolder;
                folderStart = i + 1
            }
        }
        if (!node.isBucket) {
            protoNodes[node.fqn] = node;
        }
        node.path = name.substring(0, folderStart);
        const fileName = name.substring(folderStart, i);
        node.fileName = fileName;
        if (curFolder.$O === 0) {
            curFolder.$F.push(node)
        } else {
            let insertIndex = 0;
            for (let j = 0, l = curFolder.$F.length; j < l; j++) {
                if (curFolder.$F[j].fileName <= fileName) {
                    insertIndex++
                } else {
                    break
                }
            }
            curFolder.$F.splice(insertIndex, 0, node)
        }
    }
}

function nodeFolderSort(a, b) {
    if (a.fileName < b.fileName)
        return -1;
    if (a.fileName === b.fileName)
        return 0;
    return 1
}

export {GomTree, StaticGomTree, nodesByFqn, protoNodes, nodeFolderSort, currentNode};