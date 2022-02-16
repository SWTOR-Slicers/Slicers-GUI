const esmRequire = require("esm")(module/*, options*/);

const { DelayableLoop } = esmRequire("./util/DelayableLoop.js");

class Dom {
    constructor() {
        // assets
        this.archives = [];
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

    flush(resPath, torsPath) {
        // Reset all values

        // assets
        this.archives = [];
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

        sendToSubs("flushDom", {});

        setResourcePath(resPath, torsPath);
    }
}

const { ipcMain } = require("electron");
const { Worker } = require('worker_threads');
const devBuild = true;
// require("../../api/devFlag.js").isDev
const domWorker = new Worker(`${devBuild ? "./src/js/classes/DomThread.js" : "./resources/app/src/js/classes/DomThread.js"}`);

domWorker.on('message', async (data) => {
    switch (data.message) {
        case "archives":
            MainDom.archivesLoad = `${data.data.numLoaded / data.data.totalTors * 100}%`;
            MainDom.archives.push(data.data);

            sendToSubs("domUpdate", {
                "prop": "archives",
                "value": data.data
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
                ...data.data
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

const updateSubs = [];
const MainDom = new Dom();

async function initSendDom(sender, fields) {
    if (fields.includes("archives")) {
        const tmp = new DelayableLoop({
            delay: 100,
            min: 0,
            max: MainDom.archives.length,
            logic: (i) => {
                const sec = MainDom.archives[i];
                sender.send("sentDomSec", {
                    "prop": "archives",
                    "value": sec
                });
            }
        }).loop();
    }

    if (fields.includes("nodes")) {
        sender.send("sentDomSec", {
            "prop": "_dom",
            "value": MainDom._dom
        });

        const tmp = new DelayableLoop({
            delay: 100,
            min: 0,
            max: MainDom.nodeSecs.length,
            logic: (i) => {
                const sec = MainDom.nodeSecs[i];
                sender.send("sentDomSec", {
                    "prop": "nodeSec",
                    "value": sec
                });
            }
        }).loop();
    }
}

function sendToSubs(event, data) {
    for (const entr of updateSubs) {
        const webCont = entr.sender;
        if (data.prop == "archives") {
            if (entr.subs.includes("archives")) {
                webCont.send(event, data);
            }
        } else if (data.prop == "_dom" || data.prop == "nodes" || data.prop == "protos") {
            if (entr.subs.includes("nodes")) {
                webCont.send(event, data);
            }
        } else {
            webCont.send(event, data);
        }
    }
}

ipcMain.on("getDom", (event, data) => {
    initSendDom(event.sender, data);

    event.returnValue = {
        "isLoading": MainDom.isLoading,
        "hasLoaded": MainDom.hasLoaded
    }
});
ipcMain.on("subscribeDom", (event, data) => { updateSubs.push({ "sender": event.sender, "subs": data}); event.returnValue = true; });

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