import {Node, NodeEntr} from "../../classes/Node.js";

const FILETREE_HEIGHT = 16;
const NUM_META_FOLDERS = 2;
const nodesByFqn = {
    "files": [], //files
    "open": 2,
    "_misc": {
        "files": [], //files
        "open": 0
    }
};

class NodeTree {
    constructor(renderTarg, treeList) {
        this.renderTarg = renderTarg;

        this.loadedBuckets = 0;
        this.hoverEle = -1;

        this.scroller = document.getElementById('nav_nodes_scroller');
        this.scrollercon = document.getElementById('nav_nodes_scrollercon');
        this.scrollersize = document.getElementById('nav_nodes_scrollersize');
        this.scroller.onscroll = this.redraw;
        this.scroller.onmousemove = this.redraw;
        this.scroller.onmouseout = this.redraw;
        this.scrollercon.onmousedown = this.click;
        this.canvas = treeList;
        let scale = window.devicePixelRatio; 
            
        this.canvas.width = Math.floor(this.canvas.clientWidth * scale);
        this.canvas.height = Math.floor(this.canvas.clientHeight * scale);
        this.ctx = this.canvas.getContext('2d', {
            alpha: false
        });
        this.ctx.scale(scale, scale);
        this.resizefull();
        this.redraw();
    }
    
    redraw = (e) => {
        this.canvas.width = this.scrollersize.offsetWidth;
        this.canvas.height = this.scrollersize.offsetHeight;
        this.ctx.font = 'normal normal 200 10pt Eurofont';
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        if (e) {
            this.hoverEle = 15 - this.scroller.scrollTop + (e.offsetY & 0xFFFFF0)
        }
        if (this.loadedBuckets === 0) {
            this.ctx.fillStyle = '#43c4ef';
            this.ctx.fillText('Loading...', 170, 26)
        } else {
            this.drawfolder(nodesByFqn, 15 - this.scroller.scrollTop, FILETREE_HEIGHT - this.scroller.scrollLeft, this.scrollersize.offsetHeight)
        }
    }
    
    drawfolder = (folder,heightIn,level,maxHeight) => {
        let height = heightIn;
        const dirs = Object.keys(folder).sort();
        const fl = folder.files.length;
        for (let i = NUM_META_FOLDERS, l = dirs.length; i < l; i++) {
            if (height > 0 && height - FILETREE_HEIGHT < maxHeight) {
                if (height === this.hoverEle) {
                    this.ctx.fillStyle = 'rgb(71, 71, 71)';
                    this.ctx.fillRect(level + 5, height - 12, 500, FILETREE_HEIGHT)
                }
                this.ctx.fillStyle = '#ffce00';
                if (i > NUM_META_FOLDERS || folder !== nodesByFqn) {
                    this.ctx.fillRect(3 + level - 11, height - 14, 1, 1);
                    this.ctx.fillRect(3 + level - 11, height - 12, 1, 1);
                    this.ctx.fillRect(3 + level - 11, height - 10, 1, 1)
                }
                this.ctx.fillRect(3 + level - 5, height - 4, 1, 1);
                this.ctx.fillRect(3 + level - 3, height - 4, 1, 1);
                this.ctx.fillRect(3 + level - 1, height - 4, 1, 1);
                this.ctx.fillRect(3 + level - 15, height - 8, 9, 1);
                this.ctx.fillRect(3 + level - 15, height, 9, 1);
                this.ctx.fillRect(3 + level - 15, height - 7, 1, 7);
                this.ctx.fillRect(3 + level - 7, height - 7, 1, 7);
                this.ctx.fillRect(3 + level - 13, height - 4, 5, 1);
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillText(dirs[i], 5 + level, height)
            }
            const curDir = folder[dirs[i]];
            if (curDir.open === 2) {
                let prevHeight = height;
                height = this.drawfolder(curDir, height + FILETREE_HEIGHT, level + FILETREE_HEIGHT, maxHeight);
                if (i + 1 < l || fl > 0) {
                    let newHeight = height - 14;
                    if (prevHeight < 0)
                        prevHeight = 0;
                    if (newHeight > maxHeight)
                        newHeight = maxHeight;
                    this.ctx.fillStyle = '#43c4ef';
                    for (let j = prevHeight; j < newHeight; j += 2) {
                        this.ctx.fillRect(3 + level - 11, j, 1, 1)
                    }
                }
            } else {
                this.ctx.fillStyle = '#43c4ef';
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
                this.ctx.fillStyle = '#43c4ef';
                if (i > 0) {
                    this.ctx.fillRect(3 + level - 11, height - 18, 1, 1);
                    this.ctx.fillRect(3 + level - 11, height - 16, 1, 1)
                }
                this.ctx.fillRect(3 + level - 11, height - 14, 1, 1);
                this.ctx.fillRect(3 + level - 11, height - 12, 1, 1);
                this.ctx.fillRect(3 + level - 11, height - 10, 1, 1);
                this.ctx.fillRect(3 + level - 11, height - 8, 1, 1);
                this.ctx.fillRect(3 + level - 11, height - 6, 1, 1);
                this.ctx.fillRect(3 + level - 11, height - 4, 1, 1);
                this.ctx.fillRect(3 + level - 9, height - 4, 1, 1);
                this.ctx.fillRect(3 + level - 7, height - 4, 1, 1);
                this.ctx.fillRect(3 + level - 5, height - 4, 1, 1);
                this.ctx.fillRect(3 + level - 3, height - 4, 1, 1);
                this.ctx.fillRect(3 + level - 1, height - 4, 1, 1);
                const curFile = folder.files[i];
                this.ctx.fillStyle = '#43c4ef';
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
    
    clickfolder = (folder,heightIn,level,target) => {
        let height = heightIn;
        const dirs = Object.keys(folder).sort();
        const fl = folder.files.length;
        for (let i = NUM_META_FOLDERS, l = dirs.length; i < l; i++) {
            const curDir = folder[dirs[i]];
            if (height === target) {
                if (curDir.open === 0)
                    curDir.files.sort(nodeFolderSort);
                curDir.open = (curDir.open === 2) ? 1 : 2;
                this.resizefull();
                this.redraw();
                return 0
            }
            if (curDir.open === 2) {
                height = this.clickfolder(curDir, height + FILETREE_HEIGHT, level + FILETREE_HEIGHT, target);
                if (height === 0)
                    return 0
            } else {
                height += FILETREE_HEIGHT
            }
        }
        for (let i = 0; i < fl; i++) {
            if (height === target) {
                folder.files[i].render(this.renderTarg);
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
            if (dir.open === 2) {
                height += this.resizedir(dir)
            }
        }
        height += (dirs.length - NUM_META_FOLDERS + folder.files.length) * FILETREE_HEIGHT;
        return height
    }
}

class GomTree {
    constructor (treeList, viewContainer) {
        this.nodeTree = new NodeTree(viewContainer, treeList);
    }

    /**
     * Adds a node to the Gom tree, and saves the created nodeElem to a dictionary
     * @param {NodeEntr} node A Node object representing the node entry data from the GO node reader.
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
                    tmpFolder.files = [];
                    tmpFolder.open = 0;
                    curFolder[folderName] = tmpFolder
                }
                curFolder = tmpFolder;
                folderStart = i + 1
            }
        }
        node.path = name.substr(0, folderStart);
        const fileName = name.substring(folderStart, i);
        node.fileName = fileName;
        if (curFolder.open === 0) {
            curFolder.files.push(node)
        } else {
            let insertIndex = 0;
            for (let j = 0, l = curFolder.files.length; j < l; j++) {
                if (curFolder.files[j].fileName <= fileName) {
                    insertIndex++
                } else {
                    break
                }
            }
            curFolder.files.splice(insertIndex, 0, node)
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

export {GomTree, nodesByFqn, nodeFolderSort};