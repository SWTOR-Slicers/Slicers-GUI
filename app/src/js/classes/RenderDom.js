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
let bktsLoaded = 0;

class Dom {
    #assetsProgress;
    #assetsComplete;
    #domUpdate;
    #nodesUpdate;
    #protosUpdate;
    #gomCompleteCheck;

    constructor() {
        // assets
        this.assets = [];

        // GOM Tree
        this._dom = {};
        this.nodes = [];
        this.protos = [];

        // status props
        this.assetsLoad = "0.0%";
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

    set assetsProgress(newHook) {
        this.#assetsProgress = (progress) => {
            this.assetsLoad = progress;
            newHook(progress);
        }
    }

    set assetsComplete(newHook) {
        this.#assetsComplete = () => {
            if (this.assetsLoad === "100%" && this._domLoad === "100%" && this.nodesLoad === "100%" && this.protosLoad === "100%") {
                this.hasLoaded = true;
                this.isLoading = false;
            }
            newHook();
        }
    }

    set domUpdate(newHook) {
        this.#domUpdate = (progress) => {
            this._domLoad = progress;
            newHook(progress);
        }
    }

    set nodesUpdate(newHook) {
        this.#nodesUpdate = (progress) => {
            this.nodesLoad = progress;
            newHook(progress);
        }
    }

    set protosUpdate(newHook) {
        this.#protosUpdate = (progress) => {
            this.protosLoad = progress;
            newHook(progress);
        }
    }

    set gomCompleteCheck(newHook) {
        this.#gomCompleteCheck = () => {
            if (this.assetsLoad === "100%" && this._domLoad === "100%" && this.nodesLoad === "100%" && this.protosLoad === "100%") {
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
                    this.#domUpdate('100%', e.data.data);
                    break;
                case "NODES":
                    bktsLoaded++;
                    this.#nodesUpdate(`${bktsLoaded / 500 * 100}%`, {
                        "nodes": e.data.data,
                        "isBkt": true
                    });
                    break;
                case "PROTO":
                    this.#protosUpdate(`${e.data.data.numLoaded / e.data.data.total * 100}%`, {
                        "nodes": e.data.data.nodes,
                        "isBkt": false
                    });
                    break;
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
                    this.#assetsProgress(`${e.data.data.numLoaded / e.data.data.totalTors * 100}%`);
                    break;
                case "complete":
                    this.#assetsComplete(e.data.data.archives);
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

    toJSON() {
        return {
            "_class": "DOM",
            "_dom": this._dom,
            "nodes": this.nodes,
            "protos": this.protos,

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
            res._dom = json._dom;
            res.nodes = json.nodes;
            res.protos = json.protos;

            res.archivesLoad = json.archivesLoad;
            res._domLoad = json._domLoad;
            res.nodesLoad = json.nodesLoad;
            res.protosLoad = json.protosLoad;

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

const RenderDom = new Proxy(RenderDomFactory.getDom(), {
    set: (target, prop, val) => {
        if (prop.includes("Load")) {
            Reflect.set(target, prop, val);
        } else if (prop.includes("update_")) {
            const trueProp = prop.substring(7);

            Reflect.set(target, trueProp, val);
        } else {
            ipcRenderer.sendSync("domUpdate", {
                "prop": prop,
                "value": val
            });

            Reflect.set(target, prop, val);
        }

        return true;
    }
});

// render listeners
ipcRenderer.on("mainUpdated", (event, data) => {
    RenderDom[`update_${data.prop}`] = data.value;
});

export { RenderDom };