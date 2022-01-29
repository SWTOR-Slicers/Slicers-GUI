const { parentPort } = require("worker_threads");

const esmRequire = require("esm")(module/*, options*/);
const { Archive } = esmRequire("../../classes/formats/Archive.js");

const path = require('path');
const { serializeBigInt } = esmRequire("../../Util.js");

const cache = {
    "configPath": "",
    "tmpPath": "",
    "store": {}
}

parentPort.on("message", async (data) => {
    switch (data.message) {
        case "init":
            cache['configPath'] = path.normalize(path.join(data.data, "config.json"));
            break;
        case "loadAssets":
            loadArchives(data.data.torFiles);
            break;
    }
});

async function loadArchives(torFiles) {
    let numLoaded = 0;

    torFiles.forEach((tf, idx) => {
        numLoaded++;
        loadArchive(tf, numLoaded, torFiles.length, idx);
    });
}

async function loadArchive(torPath, numLoaded, totalTors, idx) {
    const archive = new Archive(torPath, idx, true);

    parentPort.postMessage({
        "message": "archives",
        "data": {
            "archive": JSON.stringify(archive, serializeBigInt),
            "numLoaded": numLoaded,
            "totalTors": totalTors
        }
    });
}