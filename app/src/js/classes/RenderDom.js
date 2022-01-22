import { GomTree, nodeFolderSort } from "../viewers/node-viewer/GomTree.js";
import { NodeEntr } from "./formats/Node.js";

import { inflateZlib } from "../Util.js";
import { Archive } from "./formats/Archive.js";

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
    #gomCompleteCheck;

    constructor() {
        // assets
        this.archives = {};
        this.assets = {};

        // GOM Tree
        this._dom = {};
        this.gomTree = new GomTree();

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
        this.#gomCompleteCheck = null;
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
     * @param {Function} newHook
     */
    set gomCompleteCheck(newHook) {
        this.#gomCompleteCheck = () => {
            if (this.archivesLoad === "100%" && this._domLoad === "100%" && this.nodesLoad === "100%" && this.protosLoad === "100%") {
                this.hasLoaded = true;
                this.isLoading = false;
            }
            newHook();
        }
    }

    load(json) {
        this.isLoading = true;

        gomWorker.postMessage({
            "message": 'loadNodes',
            "data": json.nodeTors,
            "prots": true
        });

        assetWorker.postMessage({
            "message": 'loadAssets',
            "data": {
                "torFiles": json.torFiles
            }
        });
    }

    initWorkers(resourcePath, sourcePath) {
        if (!this.isLoading) {
            decompressZlib = (params) => {
                const ret = inflateZlib(path.dirname(path.join(resourcePath, "config.json")), params);
                return ret;
            }
            this.initAssetWorker(resourcePath, sourcePath);
            this.initGomWorker(resourcePath, sourcePath);
        }
    }

    initGomWorker(resourcePath, sourcePath) {
        gomWorker = new Worker(path.join(sourcePath, "js", "viewers", "node-viewer", "GomWorker.js"), {
            type: "module"
        });

        gomWorker.onerror = (e) => { console.log(e); throw new Error(`${e.message} on line ${e.lineno}`); }
        gomWorker.onmessageerror = (e) => { console.log(e); throw new Error(`${e.message} on line ${e.lineno}`); }
        gomWorker.onmessage = (e) => {
            switch (e.data.message) {
                case "DomElements":
                    this._domLoad = "100%";
                    this._dom = e.data.data;
                    this.#domUpdate('100%');
                    break;
                case "NODES": {
                    for (const n of e.data.data) {
                        const node = new NodeEntr(n.node, n.torPath, this._dom, decompressZlib);
                        this.gomTree.addNode(node);
                    }
                    this.gomTree.loadedBuckets++;
                    ipcRenderer.sendSync("domUpdate", {
                        "prop": "loadedBuckets",
                        "value": this.gomTree.loadedBuckets
                    });
                    this.gomTree.nodesByFqn.$F.sort(nodeFolderSort);

                    const progress = `${this.gomTree.loadedBuckets / 500 * 100}%`;
                    this.nodesLoad = progress;

                    const ext = {
                        "nodes": e.data.data,
                        "isBkt": true
                    };
                    ipcRenderer.sendSync("domUpdate", {
                        "prop": "nodes",
                        "value": ext
                    });
                    this.#nodesUpdate(progress, ext);
                    break;
                }
                case "PROTO": {
                    for (const n of e.data.data.nodes) {
                        const testProto = new NodeEntr(n.node, n.torPath,this._dom, decompressZlib);
                        this.gomTree.addNode(testProto);
                    }
                    this.gomTree.nodesByFqn.$F.sort(nodeFolderSort);

                    const progress = `${e.data.data.numLoaded / e.data.data.total * 100}%`;
                    this.protosLoad = progress;

                    ipcRenderer.sendSync("domUpdate", {
                        "prop": "protos",
                        "value": e.data.data
                    });
                    this.#protosUpdate(progress, e.data.data);
                    break;
                }
            }
            
            this.#gomCompleteCheck();
        }

        gomWorker.postMessage({
            "message": "init",
            "data": [ resourcePath, sourcePath ]
        });
    }

    initAssetWorker(resourcePath, sourcePath) {
        assetWorker = new Worker(path.join(sourcePath, "js", "viewers", "asset-viewer", "AssetWorker.js"), {
            type: "module"
        });
    
        assetWorker.onerror = (e) => { console.log(e); throw new Error(`${e.message} on line ${e.lineno}`); }
        assetWorker.onmessageerror = (e) => { console.log(e); throw new Error(`${e.message} on line ${e.lineno}`); }
        assetWorker.onmessage = (e) => {
            switch (e.data.message) {
                case "progress":
                    this.archivesLoad = `${e.data.data.numLoaded / e.data.data.totalTors * 100}%`;
                    this.#assetsProgress(`${e.data.data.numLoaded / e.data.data.totalTors * 100}%`);
                    break;
                case "complete":
                    if (this.archivesLoad === "100%" && this._domLoad === "100%" && this.nodesLoad === "100%" && this.protosLoad === "100%") {
                        this.hasLoaded = true;
                        this.isLoading = false;
                    }
                    this.archives = e.data.data.archives;
                    this.#assetsComplete();
                    break;
            }
        }
    
        assetWorker.postMessage({
            "message": "init",
            "data": resourcePath
        });
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
        this.gomCompleteCheck = hooks.gomHooks.gomCompleteCheck;
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
            case "archivesLoad":
                if (this.archivesLoad === "100%") {
                    return (this.#assetsComplete) ? () => { this.#assetsComplete() } : null;
                } else {
                    return (this.#assetsProgress) ? () => { this.#assetsProgress(this.archivesLoad) } : null;
                }
            case "_domLoad": {
                return (this.#domUpdate) ? () => { this.#domUpdate(this._domLoad) } : null;
            }
            case "nodesLoad": {
                return (this.#nodesUpdate) ? () => { this.#nodesUpdate(this.nodesLoad, data) } : null;
            }
            case "protosLoad": {
                return (this.#protosUpdate) ? () => { this.#protosUpdate(this.protosLoad, data) } : null;
            }
        }
    
        return null;
    }

    toJSON() {
        return {
            "_class": "DOM",
            "archives": this.archives,
            "assets": this.assets,

            "_dom": this._dom,
            "nodesList": this.gomTree.nodesList,

            "archivesLoad": this.archivesLoad,

            "_domLoad": this._domLoad,
            "nodesLoad": this.nodesLoad,
            "protosLoad": this.protosLoad,

            "isLoading": this.isLoading,
            "hasLoaded": this.hasLoaded
        }
    }

    static fromJSON(json) {
        if (json._class === "DOM") {
            const res = new Dom();
            res.archives = json.archives;
            res.assets = json.assets;

            res._dom = json._dom;
            const itter = Object.values(json.nodesList);
            for (const n of itter) {
                const node = new NodeEntr(n.node, n.torPath, res._dom, decompressZlib);
                res.gomTree.addNode(node);

                res.gomTree.nodesByFqn.$F.sort(nodeFolderSort);
            }
            res.gomTree.loadedBuckets = itter.length > 0 ? 500 : 0;

            res.archivesLoad = json.archivesLoad;

            res._domLoad = json._domLoad;
            res.nodesLoad = json.nodesLoad;
            res.protosLoad = json.protosLoad;

            res.isLoading = json.isLoading;
            res.hasLoaded = json.hasLoaded;

            return res;
        } else {
            throw `Unexpected JSON recieved. Object needs _class property with value of DOM. Got ${json._class}`;
        }
    }
}

const { ipcRenderer } = require("electron");
const path = require("path");

class RenderDomFactory {
    static DOM;
    static getDom() {
        ipcRenderer.sendSync("subscribeDom");
        const jDom = JSON.parse(ipcRenderer.sendSync("getDom"));
        this.DOM = Dom.fromJSON(jDom);
        return this.DOM;
    }
}
const ignore = [
    "assetsProgress",
    "assetsComplete",
    "domUpdate",
    "nodesUpdate",
    "protosUpdate",
    "gomCompleteCheck"
];
const RenderDom = new Proxy(RenderDomFactory.getDom(), {
    get(target, prop, receiver) {
        let value = Reflect.get(...arguments);
        return typeof value == 'function' ? value.bind(target) : value;
    },
    set: (target, prop, val) => {
        if (ignore.includes(prop)) {
            Reflect.set(target, prop, val);
        } else if (prop.includes("Load")) {
            Reflect.set(target, prop, val);
        } else if (prop.includes("update_")) {
            const trueProp = prop.substring(7);

            Reflect.set(target, trueProp, val);
        } else {
            if (prop === "Archive") {
                ipcRenderer.sendSync("domUpdate", {
                    "prop": prop,
                    "value": JSON.stringify(val)
                });
            } else {
                ipcRenderer.sendSync("domUpdate", {
                    "prop": prop,
                    "value": val
                });
            }

            Reflect.set(target, prop, val);
        }

        return true;
    }
});

// render listeners
ipcRenderer.on("mainUpdated", (event, data) => {
    let dat = data.value
    
    if (data.prop === "nodes" || data.prop === "protos") {
        if (dat.isBkt) {
            for (const n of dat.nodes) {
                const node = new NodeEntr(n.node, n.torPath, RenderDom._dom, decompressZlib);
                RenderDom.gomTree.addNode(node);
            }
            RenderDom.gomTree.loadedBuckets++;
            RenderDom.gomTree.nodesByFqn.$F.sort(nodeFolderSort);
        } else {
            for (const n of dat.nodes) {
                const testProto = new NodeEntr(n.node, n.torPath, RenderDom._dom, decompressZlib);
                RenderDom.gomTree.addNode(testProto);
            }
            RenderDom.gomTree.nodesByFqn.$F.sort(nodeFolderSort);
        }
    } else {
        if (prop === "archives") {
            dat.map((dat) => {
                Archive.fromJSON(dat);
            });
        }
        RenderDom[`update_${data.prop}`] = dat;
        
        if (data.prop.includes("Load")) {
            const handler = RenderDom.detHandler(data.prop, data.value);
            if (handler) handler();
        }
    }
});

export { RenderDom };