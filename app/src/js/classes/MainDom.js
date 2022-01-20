class Dom {
    constructor() {
        // assets
        this.archives = [];

        // GOM Tree
        this._dom = {};
        this.nodes = [];
        this.protos = [];

        // status props
        this.archivesLoad = "0.0%";
        this._domLoad = "0.0%";
        this.nodesLoad = "0.0%";
        this.protosLoad = "0.0%";

        // DOM status
        this.isLoading = false;
        this.hasLoaded = false;
    }

    getLoadStatus(field) {
        const stat = this[`${field}Load`];
        if (stat) {
            return stat;
        } else {
            throw `Unkown field ${field}. Expected archives, nodes, protos or _dom.`;
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
            throw `Unexpected JSON recieved. Object needs _class property with value of DOM`;
        }
    }
}

const { ipcMain } = require("electron");

const updateSubs = [];
const progressSubs = [];
const MainDom = new Dom();

// main listeners
ipcMain.on("domUpdate", (event, data) => {
    // for (const webCont of updateSubs) {
    //     webCont.send("mainUpdated", data);
    // }
    console.log('triggered dom update');

    event.returnValue = true;
});
ipcMain.on("getDom", (event) => {
    event.returnValue = JSON.stringify(MainDom);
});
ipcMain.on("subscribeDom", (event) => {
    updateSubs.push(event.sender);
    event.returnValue = true;
});

module.exports = {
    "MainDom": MainDom
}