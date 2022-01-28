import { GomTree, nodeFolderSort } from "../viewers/node-viewer/GomTree.js";
import { NodeEntr } from "./formats/Node.js";

import { inflateZlib, serializeBigInt } from "../Util.js";
import { Archive } from "./formats/Archive.js";
import { deserializeBigInt } from "../Util.js";

/**
 * AssetsUpdateHooks type definition
 * @typedef {Object} AssetsUpdateHooks
 * @property {Function} assetsProgress
 * @property {Function} assetsComplete
 */

/**
 * GomUpdateHooks type definition
 * @typedef {Object} GomUpdateHooks
 * @property {Function} domUpdate
 * @property {Function} nodesUpdate
 * @property {Function} protosUpdate
 * @property {Function} gomCompleteCheck
 */

/**
 * UpdateHooks type definition
 * @typedef {Object} UpdateHooks
 * @property {AssetsUpdateHooks} assetHooks
 * @property {GomUpdateHooks} gomHooks
 */

let gomWorker, assetWorker;

let decompressZlib = (params) => {}

class Dom {
    #assetsProgress;
    #assetsComplete;
    #domUpdate;
    #nodesUpdate;
    #protosUpdate;

    constructor() {
        // assets
        this.archives = {};
        this.assets = {};

        // GOM Tree
        this._dom = {};
        this.gomTree = new GomTree();
        this.nodesList = [];

        // status props
        this.archivesLoad = "0.0%";
        this._domLoad = "0.0%";
        this.nodesLoad = "0.0%";
        this.protosLoad = "0.0%";

        // DOM status
        this.isLoading = false;
        this.hasLoaded = false;

        // private hooks
        this.#assetsProgress = null;
        this.#assetsComplete = null;
        this.#domUpdate = null;
        this.#nodesUpdate = null;
        this.#protosUpdate = null;
    }

    /**
     * @param {Function} newHook
     */
    set assetsProgress(newHook) {
        this.#assetsProgress = (progress) => {
            newHook(progress);
        }
    }
    /**
     * @param {Function} newHook
     */
    set assetsComplete(newHook) {
        this.#assetsComplete = () => {
            newHook();
        }
    }
    /**
     * @param {Function} newHook
     */
    set domUpdate(newHook) {
        this.#domUpdate = (progress) => {
            newHook(progress);
        }
    }
    /**
     * @param {Function} newHook
     */
    set nodesUpdate(newHook) {
        this.#nodesUpdate = (progress, data) => {
            newHook(progress, data);
        }
    }
    /**
     * @param {Function} newHook
     */
    set protosUpdate(newHook) {
        this.#protosUpdate = (progress, data) => {
            newHook(progress, data);
        }
    }

    /**
     * @param  {UpdateHooks} hooks
     */
    hook(hooks) {
        this.assetsProgress = hooks.assetHooks.assetsProgress;
        this.assetsComplete = hooks.assetHooks.assetsComplete;
        
        this.domUpdate = hooks.gomHooks.domUpdate;
        this.nodesUpdate = hooks.gomHooks.nodesUpdate;
        this.protosUpdate = hooks.gomHooks.protosUpdate;
    }

    getLoadStatus(fields, progBars) {
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            const progBar = progBars[i];
            const stat = this[`${field}Load`];
            if (stat) {
                progBar.style.width = stat;
            } else {
                throw `Unkown field ${field}. Expected archives, nodes, protos or _dom.`;
            }
        }
    }

    invokeHandlerPost(prop) {
        switch (prop) {
            case "archives":
                if (this.archivesLoad === "100%") {
                    return (this.#assetsComplete) ? () => { this.#assetsComplete() } : null;
                } else {
                    return (this.#assetsProgress) ? () => { this.#assetsProgress(this.archivesLoad) } : null;
                }
            case "_dom": {
                return (this.#domUpdate) ? () => { this.#domUpdate(this._domLoad) } : null;
            }
            case "nodes": 
            case "protos": {
                return (this.#nodesUpdate) ? () => { this.#nodesUpdate(this.nodesLoad, this.gomTree.nodesList) } : null;
            }
        }
    
        return null;
    }

    detHandler(prop, data) {
        switch (prop) {
            case "archives":
                if (this.archivesLoad === "100%") {
                    return (this.#assetsComplete) ? () => { this.#assetsComplete() } : null;
                } else {
                    return (this.#assetsProgress) ? () => { this.#assetsProgress(this.archivesLoad) } : null;
                }
            case "_dom": {
                return (this.#domUpdate) ? () => { this.#domUpdate(this._domLoad) } : null;
            }
            case "nodes": {
                return (this.#nodesUpdate) ? () => { this.#nodesUpdate(this.nodesLoad, data) } : null;
            }
            case "protos": {
                return (this.#protosUpdate) ? () => { this.#protosUpdate(this.protosLoad, data) } : null;
            }
        }
    
        return null;
    }
}

const { ipcRenderer } = require("electron");

class RenderDomFactory {
    static DOM;
    /**
     * @returns {Dom}
     */
    static getDom(fields) {
        const data = fields ? fields : ["archives", "_dom", "nodes"];
        ipcRenderer.sendSync("subscribeDom", data);
        const res = ipcRenderer.sendSync("getDom", data);
        this.DOM = new Dom();
        this.DOM.isLoading = res.isLoading;
        this.DOM.hasLoaded = res.hasLoaded;
        return this.DOM;
    }
}

// render listeners
ipcRenderer.on("sentDomSec", (event, data) => {
    if (RenderDomFactory.DOM) {
        const prop = data.prop;
        const value = data.value;

        switch (prop) {
            case "archives":
                RenderDomFactory.DOM[`update_archives`] = JSON.parse(value, deserializeBigInt).map(arc => Archive.fromJSON(arc) );
                RenderDomFactory.DOM[`update_archivesLoad`] = "100%";
                break;
            case "_dom":
                RenderDomFactory.DOM[`update__dom`] = value;
                RenderDomFactory.DOM[`update__domLoad`] = "100%";
                break;
            case "nodesSec":
                if (value.isBkt) {
                    for (const n of value.nodes) {
                        RenderDomFactory.DOM.nodesList.push(n);
                        const node = new NodeEntr(n.node, n.torPath, RenderDomFactory.DOM._dom, decompressZlib);
                        RenderDomFactory.DOM.gomTree.addNode(node);
                    }
                    
                    RenderDomFactory.DOM.gomTree.nodesByFqn.$F.sort(nodeFolderSort);
                    RenderDomFactory.DOM[`update_nodesLoad`] = value.nodesLoad;
                    RenderDomFactory.DOM.gomTree.loadedBuckets = value.loadedBuckets;
                } else {
                    for (const n of value.nodes) {
                        RenderDomFactory.DOM.nodesList.push(n);
                        const testProto = new NodeEntr(n.node, n.torPath, RenderDomFactory.DOM._dom, decompressZlib);
                        RenderDomFactory.DOM.gomTree.addNode(testProto);
                    }
                    RenderDomFactory.DOM.gomTree.nodesByFqn.$F.sort(nodeFolderSort);
                    RenderDomFactory.DOM[`update_protosLoad`] = value.protosLoad;
                }
                break;
        }

        const handler = RenderDomFactory.DOM.detHandler(prop, value);
        if (handler) handler();
    }
});
ipcRenderer.on("domUpdate", (event, data) => {
    if (RenderDomFactory.DOM) {
        let dat = data.value
        const prop = data.prop;

        switch (prop) {
            case "nodes":
            case "protos": {
                if (dat.isBkt) {
                    for (const n of dat.nodes) {
                        RenderDomFactory.DOM.nodesList.push(n);
                        const node = new NodeEntr(n.node, n.torPath, RenderDomFactory.DOM._dom, decompressZlib);
                        RenderDomFactory.DOM.gomTree.addNode(node);
                    }
                    
                    RenderDomFactory.DOM.gomTree.nodesByFqn.$F.sort(nodeFolderSort);
                    RenderDomFactory.DOM.nodesLoad = dat.nodesLoad;
                    RenderDomFactory.DOM.gomTree.loadedBuckets = dat.loadedBuckets;
                } else {
                    for (const n of dat.nodes) {
                        RenderDomFactory.DOM.nodesList.push(n);
                        const testProto = new NodeEntr(n.node, n.torPath, RenderDomFactory.DOM._dom, decompressZlib);
                        RenderDomFactory.DOM.gomTree.addNode(testProto);
                    }
                    RenderDomFactory.DOM.gomTree.nodesByFqn.$F.sort(nodeFolderSort);
                    RenderDomFactory.DOM.protosLoad = dat.protosLoad;
                }
                break;
            }
            case "archives":
                RenderDomFactory.DOM[prop] = JSON.parse(dat, deserializeBigInt).map(arc => Archive.fromJSON(arc) );
                break;
            case "_dom":
                RenderDomFactory.DOM._dom = dat._dom;
                RenderDomFactory.DOM._domLoad = dat._domLoad;
                break;
            default:
                RenderDomFactory.DOM[prop] = dat;
                break;
        }

        if (prop === "archives" || prop === "_dom" || prop === "nodes" || prop === "protos") {
            const handler = RenderDomFactory.DOM.detHandler(prop, dat);
            if (handler) handler();
        }
    }
});

export { RenderDomFactory };