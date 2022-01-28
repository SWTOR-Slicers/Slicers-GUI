const { Worker, parentPort } = require("worker_threads");
const fs = require("fs");
let gomWorker, assetWorker;

function initSubWorkers(resourcePath) {
    gomWorker = new Worker(`./src/js/viewers/node-viewer/GomWorker.js`);

    gomWorker.on("error", (e) => {
        console.log(e); throw new Error(`${e.message} on line ${e.lineno}`);
    });
    gomWorker.on("messageerror", (e) => {
        console.log(e); throw new Error(`${e.message} on line ${e.lineno}`);
    });
    gomWorker.on("message", (data) => {
        parentPort.postMessage(data);
    });

    gomWorker.postMessage({
        "message": "init",
        "data": resourcePath
    });


    assetWorker = new Worker(`./src/js/viewers/asset-viewer/AssetWorker.js`);

    assetWorker.on("error", (e) => {
        console.log(e); throw new Error(`${e.message} on line ${e.lineno}`);
    });
    assetWorker.on("messageerror", (e) => {
        console.log(e); throw new Error(`${e.message} on line ${e.lineno}`);
    });
    assetWorker.on("message", (data) => {
        parentPort.postMessage(data);
    });

    assetWorker.postMessage({
        "message": "init",
        "data": resourcePath
    });
}

parentPort.on("message", (data) => {
    switch (data.message) {
        case "init":
            initSubWorkers(data.data);
            break;
        case "load":
            const dat = fs.readFileSync(data.data);
            fs.rmSync(data.data);
            const json = JSON.parse(dat);
            
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
            break;
    }
});