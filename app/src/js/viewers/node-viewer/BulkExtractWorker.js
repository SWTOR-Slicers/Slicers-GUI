import { inflateZlib } from "../../Util.js";

const path = require('path');

const cache = {
    "configPath": "",
    "tmpPath": "",
    "hashPath": "",
    "store": {}
}

let decompressZlib = (params) => {
    const ret = inflateZlib(path.dirname(cache['configPath']), params);
    return ret;
}

onmessage = (e) => {
    switch (e.data.message) {
        case "init":
            cache['configPath'] = path.normalize(path.join(e.data.data, "config.json"));
            break;
        case "extractSubtree":
            extractSubtree(e.data.data.outputDir, e.data.data.outputType, e.data.data.nodesByFqn)
            break;
    }
}

function extractSubtree(outDir, type, nodesByFqn) {
    console.log(outDir, type, nodesByFqn);
}