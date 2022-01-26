class Dom {
    constructor() {
        // assets
        this.archives = "";
        this.assets = {};

        this.loadedBuckets = 0;

        // GOM Tree
        this._dom = {};
        this.nodeSecs = [];

        // status props
        this.archivesLoad = "0.0%";
        this._domLoad = "0.0%";
        this.nodesLoad = "0.0%";
        this.protosLoad = "0.0%";

        // DOM status
        this.isLoading = false;
        this.hasLoaded = false;
    }
}

const { ipcMain } = require("electron");
const { Worker } = require('worker_threads');
const domWorker = new Worker("./src/js/classes/DomWorker.js");
domWorker.on('message', (msg) => {
    console.log(msg);
});

function serializeBigInt(key, value) { return typeof value === "bigint" ? `BIGINT::${value}` : value }

const updateSubs = [];
const MainDom = new Dom();

// main listeners
ipcMain.on("domUpdate", (event, data) => {
    // update self
    const prop = data.prop;
    const val = data.value;

    switch (prop) {
        case "nodes":
        case "protos": {
            MainDom.nodeSecs.push(val);
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
    if (MainDom.hasLoaded) {
        initSendDom(event.sender);
    } else if (MainDom.isLoading) {

    }

    event.returnValue = {
        "isLoading": MainDom.isLoading,
        "hasLoaded": MainDom.hasLoaded
    }
});

async function initSendDom(sender) {
    sender.send("sentDomSec", {
        "prop": "archives",
        "value": MainDom.archives
    });

    sender.send("sentDomSec", {
        "prop": "_dom",
        "value": MainDom._dom
    });

    for (const sec of MainDom.nodeSecs) {
        sender.send("sentDomSec", {
            "prop": "nodeSec",
            "value": sec
        });
    }
}

ipcMain.on("subscribeDom", (event) => { updateSubs.push(event.sender); event.returnValue = true; });

function setOutputDir(newPath) {
    outputDir = newPath;
}

module.exports = {
    "MainDom": MainDom,
    "setOutputDir": setOutputDir
}