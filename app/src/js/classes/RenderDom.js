import { GomTree, nodeFolderSort } from "../viewers/node-viewer/GomTree.js";
import { NodeEntr } from "./formats/Node.js";

import { inflateZlib } from "../Util.js";
import { Archive } from "./formats/Archive.js";
import { deserializeBigInt } from "../Util.js";

const NUM_BUCKETS = 997;

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
 * @property {Function} flushHook
 */

let decompressZlib = (params) => {}

class Dom {
    #assetsProgress;
    #domUpdate;
    #nodesUpdate;
    #protosUpdate;
    #flushHook;

    constructor() {
        // assets
        this.archives = [];
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
        this.#domUpdate = null;
        this.#nodesUpdate = null;
        this.#protosUpdate = null;
        this.#flushHook = null;
    }

    /**
     * @param {Function} newHook
     */
    set assetsProgress(newHook) {
        this.#assetsProgress = (progress, data) => {
            newHook(progress, data);
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
        
        this.domUpdate = hooks.gomHooks.domUpdate;
        this.nodesUpdate = hooks.gomHooks.nodesUpdate;
        this.protosUpdate = hooks.gomHooks.protosUpdate;
        this.#flushHook = hooks.flushHook;
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

    detHandler(prop, data) {
        switch (prop) {
            case "archives":
                return (this.#assetsProgress) ? () => { this.#assetsProgress(this.archivesLoad, data) } : null;
            case "_dom": {
                return (this.#domUpdate) ? () => { this.#domUpdate(this._domLoad) } : null;
            }
            case "nodes": {
                return (this.#nodesUpdate) ? () => { this.#nodesUpdate(this.nodesLoad, data) } : null;
            }
            case "protos": {
                return (this.#protosUpdate) ? () => { this.#protosUpdate(this.protosLoad, data) } : null;
            }
            case "nodeSec": {
                if (data.isBkt) {
                    return (this.#nodesUpdate) ? () => { this.#nodesUpdate(this.nodesLoad, data) } : null;
                } else {
                    return (this.#protosUpdate) ? () => { this.#protosUpdate(this.protosLoad, data) } : null;
                }
            }
        }
    
        return null;
    }

    flush() {
        // Reset all values except hooks

        // assets
        this.archives = [];
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

        this.#flushHook();
    }
}

const { ipcRenderer } = require("electron");

class RenderDomFactory {
    static DOM;
    /**
     * @returns {Dom}
     */
    static getDom(fields, resourcePath) {
        decompressZlib = (params) => {
            const ret = inflateZlib(resourcePath, params);
            return ret;
        }
        const data = fields ? fields : ["archives", "nodes"];
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
        let value = data.value;

        switch (prop) {
            case "archives":
                value.archive = Archive.fromJSON(JSON.parse(value.archive, deserializeBigInt));
                RenderDomFactory.DOM.archives.push(value.archive);
                RenderDomFactory.DOM.archivesLoad = `${RenderDomFactory.DOM.archives.length / value.totalTors * 100}%`;
                break;
            case "_dom":
                RenderDomFactory.DOM._dom = value;
                RenderDomFactory.DOM._domLoad = "100%";
                break;
            case "nodeSec":
                if (value.isBkt) {
                    for (const n of value.nodes) {
                        RenderDomFactory.DOM.nodesList.push(n);
                        const node = new NodeEntr(n.node, n.torPath, RenderDomFactory.DOM._dom, decompressZlib);
                        RenderDomFactory.DOM.gomTree.addNode(node);
                    }
                    
                    RenderDomFactory.DOM.gomTree.nodesByFqn.$F.sort(nodeFolderSort);
                    RenderDomFactory.DOM.gomTree.loadedBuckets++;
                    RenderDomFactory.DOM.nodesLoad = `${RenderDomFactory.DOM.gomTree.loadedBuckets / NUM_BUCKETS * 100}%`;
                } else {
                    for (const n of value.nodes) {
                        RenderDomFactory.DOM.nodesList.push(n);
                        const testProto = new NodeEntr(n.node, n.torPath, RenderDomFactory.DOM._dom, decompressZlib);
                        RenderDomFactory.DOM.gomTree.addNode(testProto);
                        RenderDomFactory.DOM.gomTree.loadedPrototypes++;
                    }
                    RenderDomFactory.DOM.gomTree.nodesByFqn.$F.sort(nodeFolderSort);
                    RenderDomFactory.DOM.protosLoad = `${RenderDomFactory.DOM.gomTree.loadedPrototypes / value.total * 100}%`;
                }
                break;
        }

        const handler = RenderDomFactory.DOM.detHandler(prop, value);
        if (handler) handler();
    }
});
ipcRenderer.on("domUpdate", (event, data) => {
    if (RenderDomFactory.DOM) {
        let value = data.value
        const prop = data.prop;

        switch (prop) {
            case "nodes":
            case "protos": {
                if (value.isBkt) {
                    for (const n of value.nodes) {
                        RenderDomFactory.DOM.nodesList.push(n);
                        const node = new NodeEntr(n.node, n.torPath, RenderDomFactory.DOM._dom, decompressZlib);
                        RenderDomFactory.DOM.gomTree.addNode(node);
                    }
                    
                    RenderDomFactory.DOM.gomTree.nodesByFqn.$F.sort(nodeFolderSort);
                    RenderDomFactory.DOM.gomTree.loadedBuckets++;
                    RenderDomFactory.DOM.nodesLoad = `${RenderDomFactory.DOM.gomTree.loadedBuckets / NUM_BUCKETS * 100}%`;
                } else {
                    for (const n of value.nodes) {
                        RenderDomFactory.DOM.nodesList.push(n);
                        const testProto = new NodeEntr(n.node, n.torPath, RenderDomFactory.DOM._dom, decompressZlib);
                        RenderDomFactory.DOM.gomTree.addNode(testProto);
                        RenderDomFactory.DOM.gomTree.loadedPrototypes++;
                    }
                    RenderDomFactory.DOM.gomTree.nodesByFqn.$F.sort(nodeFolderSort);
                    RenderDomFactory.DOM.protosLoad = `${RenderDomFactory.DOM.gomTree.loadedPrototypes / value.total * 100}%`;
                }
                break;
            }
            case "archives":
                value.archive = Archive.fromJSON(JSON.parse(value.archive, deserializeBigInt));
                RenderDomFactory.DOM.archives.push(value.archive);
                RenderDomFactory.DOM.archivesLoad = `${RenderDomFactory.DOM.archives.length / value.totalTors * 100}%`;
                break;
            case "_dom":
                RenderDomFactory.DOM._dom = value._dom;
                RenderDomFactory.DOM._domLoad = value._domLoad;
                break;
            default:
                RenderDomFactory.DOM[prop] = value;
                break;
        }

        if (prop === "archives" || prop === "archivesLoad" || prop === "_dom" || prop === "nodes" || prop === "protos") {
            const handler = RenderDomFactory.DOM.detHandler(prop, value);
            if (handler) handler();
        }
    }
});
ipcRenderer.on("flushDom", () => {
    if (RenderDomFactory.DOM) RenderDomFactory.DOM.flush();
});

export { RenderDomFactory };