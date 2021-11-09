import { Archive } from "../../classes/Archive.js";

const path = require('path');

const cache = {
    "configPath": "",
    "tmpPath": "",
    "store": {}
}
let decompressZlib = function(){};

onmessage = (e) => {
    switch (e.data.message) {
        case "init":
            cache['configPath'] = path.normalize(path.join(e.data.data, "config.json"));
            break;
        case "loadAssets":
            loadArchives(e.data.data.torFiles);
            break;
    }
}

async function loadArchives(torFiles) {
    let numLoaded = 0;
    const loadedArchives = await Promise.all(torFiles.map((tf, idx) => {
        numLoaded++;
        loadArchive(tf, numLoaded, torFiles.length, idx);
    }));
    postMessage({
        "message": "",
        "data": {
            "archives": loadedArchives
        }
    })
}

async function loadArchive(torPath, numLoaded, totalTors, idx) {
    const archive = new Archive(torPath, idx, true);

    postMessage({
        "message": "progress",
        "data": {
            "numLoaded": numLoaded,
            "totalTors": totalTors
        }
    });

    return archive;
}

// Utility functions