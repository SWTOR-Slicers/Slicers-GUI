class Dom {
    constructor() {
        // assets
        this.archives = [];
        this.assets = {};

        this.loadedBuckets = 0;

        // GOM Tree
        this._dom = {};
        this.nodesList = [];

        // status props
        this.archivesLoad = "0.0%";
        this._domLoad = "0.0%";
        this.nodesLoad = "0.0%";
        this.protosLoad = "0.0%";

        // DOM status
        this.isLoading = false;
        this.hasLoaded = false;
    }

    toJSON() {
        return {
            "_class": "DOM",
            "archives": this.archives,
            "assets": this.assets,

            "_dom": this._dom,
            "nodesList": this.nodesList,
            "loadedBuckets": this.loadedBuckets,

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
            res.nodesList = json.nodesList;
            res.loadedBuckets = json.loadedBuckets;

            res.archivesLoad = json.archivesLoad;

            res._domLoad = json._domLoad;
            res.nodesLoad = json.nodesLoad;
            res.protosLoad = json.protosLoad;

            res.isLoading = json.isLoading;
            res.hasLoaded = json.hasLoaded;

            return res;
        } else {
            throw `Unexpected JSON recieved. Object needs _class property with value of DOM`;
        }
    }
}

const { ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");
const UUID = require('uuid');
const uuidV4 = UUID.v4;

function serializeBigInt(key, value) { return typeof value === "bigint" ? `BIGINT::${value}` : value }

const updateSubs = [];
const MainDom = new Dom();
let outputDir = "";

// main listeners
ipcMain.on("domUpdate", (event, data) => {
    // update self
    const prop = data.prop;
    const val = data.value;

    switch (prop) {
        case "nodes":
        case "protos": {
            for (const n of val.nodes) {
                MainDom.nodesList.push(n);
            }
            if (val.isBkt) {
                MainDom.nodesLoad = val.nodesLoad;
                MainDom.loadedBuckets++;
            } else {
                MainDom.protosLoad = val.protosLoad;
            }

            break;
        }
        case "_dom": {
            MainDom._dom = val._dom;
            MainDom._domLoad = val._domLoad;
            break;
        }
        case "archives": {
            MainDom.archives = val;
            break;
        }
        default: {
            MainDom[prop] = val;
            break;
        }
    }

    // push updates
    for (const webCont of updateSubs) {
        if (webCont.id !== event.sender.id) {
            webCont.send("mainUpdated", data);
        }
    }
    // console.log('triggered dom update');

    event.returnValue = true;
});
ipcMain.on("getDom", (event) => {
    const domJSON = JSON.stringify(MainDom, serializeBigInt);
    const domPath = path.join(outputDir, 'tmp', `${uuidV4()}-DOM.json`);
    fs.mkdirSync(path.dirname(domPath), { recursive: true });
    fs.writeFileSync(domPath, domJSON);

    event.returnValue = domPath;
});
ipcMain.on("subscribeDom", (event) => { updateSubs.push(event.sender); event.returnValue = true; });

function setOutputDir(newPath) {
    outputDir = newPath;
}

module.exports = {
    "MainDom": MainDom,
    "setOutputDir": setOutputDir
}