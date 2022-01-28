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
const domWorker = new Worker("./src/js/classes/DomThread.js");
domWorker.on('message', async (data) => {
    switch (data.message) {
        case "progress":
            MainDom.archivesLoad = `${data.data.numLoaded / data.data.totalTors * 100}%`;

            sendToSubs("domUpdate", {
                "prop": "archivesLoad",
                "value": MainDom.archivesLoad
            });
            break;
        case "complete":
            MainDom.archives = data.data.archives;
            sendToSubs("domUpdate", {
                "prop": "archives",
                "value": JSON.stringify(MainDom.archives, serializeBigInt)
            });
            break;
        case "DomElements":
            MainDom._domLoad = "100%";
            MainDom._dom = data.data;

            const ext = {
                "_dom": MainDom._dom,
                "_domLoad": MainDom._domLoad
            }

            sendToSubs("domUpdate", {
                "prop": "_dom",
                "value": ext
            });
            break;
        case "NODES": {
            MainDom.loadedBuckets++;
            const progress = `${MainDom.loadedBuckets / 500 * 100}%`;
            MainDom.nodesLoad = progress;

            const ext = {
                "nodes": data.data,
                "nodesLoad": MainDom.nodesLoad,
                "loadedBuckets": MainDom.loadedBuckets,
                "isBkt": true
            };

            MainDom.nodeSecs.push(ext);

            sendToSubs("domUpdate", {
                "prop": "nodes",
                "value": ext
            });
            break;
        }
        case "PROTO": {
            const progress = `${data.data.numLoaded / data.data.total * 100}%`;
            MainDom.protosLoad = progress;
            
            const ext = {
                ...data.data,
                "protosLoad": MainDom.protosLoad
            }

            MainDom.nodeSecs.push(ext);

            sendToSubs("domUpdate", {
                "prop": "protos",
                "value": ext
            });
            break;
        }
    }

    if (MainDom.archivesLoad === "100%" && MainDom._domLoad === "100%" && MainDom.nodesLoad === "100%" && MainDom.protosLoad === "100%") {
        console.log("done loading");
        MainDom.hasLoaded = true;

        sendToSubs("domUpdate", {
            "prop": "hasLoaded",
            "value": MainDom.hasLoaded
        });

        MainDom.isLoading = false;
        sendToSubs("domUpdate", {
            "prop": "isLoading",
            "value": MainDom.isLoading
        });
    }
});

function serializeBigInt(key, value) { return typeof value === "bigint" ? `BIGINT::${value}` : value }

const updateSubs = [];
const MainDom = new Dom();

async function initSendDom(sender, fields) {
    if (fields.includes("archives")) {
        sender.send("sentDomSec", {
            "prop": "archives",
            "value": JSON.stringify(MainDom.archives, serializeBigInt)
        });
    }

    if (fields.includes("_dom")) {
        sender.send("sentDomSec", {
            "prop": "_dom",
            "value": MainDom._dom
        });
    }

    if (fields.includes("nodes")) {
        for (const sec of MainDom.nodeSecs) {
            sender.send("sentDomSec", {
                "prop": "nodeSec",
                "value": sec
            });
        }
    }
}

function sendToSubs(event, data) {
    for (const entr of updateSubs) {
        const webCont = entr.id;
        if (data.prop == "archives" || data.prop == "_dom") {
            if (entr.subs.includes(data.prop)) {
                if (webCont.id !== event.sender.id) {
                    webCont.send(event, data);
                }
            }
        } else if (data.prop == "nodes" || data.prop == "protos") {
            if (entr.subs.includes("nodes")) {
                if (webCont.id !== event.sender.id) {
                    webCont.send(event, data);
                }
            }
        } else {
            if (webCont.id !== event.sender.id) {
                webCont.send(event, data);
            }
        }
    }
}

ipcMain.on("getDom", (event, data) => {
    if (MainDom.hasLoaded) {
        initSendDom(event.sender, data);
    } else if (MainDom.isLoading) {

    }

    event.returnValue = {
        "isLoading": MainDom.isLoading,
        "hasLoaded": MainDom.hasLoaded
    }
});
ipcMain.on("subscribeDom", (event, data) => { updateSubs.push({ "id": event.sender, "subs": data}); event.returnValue = true; });

function setResourcePath(resPath, torsPath) {
    domWorker.postMessage({
        "message": "init",
        "data": resPath
    });
    domWorker.postMessage({
        "message": "load",
        "data": torsPath
    });

    MainDom.isLoading = true;
    sendToSubs("domUpdate", {
        "prop": "isLoading",
        "value": MainDom.isLoading
    });
}

module.exports = {
    "MainDom": MainDom,
    "setResourcePath": setResourcePath
}