const { Worker, parentPort } = require("worker_threads");

let domWorker;
let nodeWorker;
let protoWorker;

parentPort.on("message", (data) => {
    switch (data.message) {
        case "init":
            initSubWorkers(data.data);
            break;
        case "loadNodes":
            loadNodes(data.data);
            break;
    }
});

function initSubWorkers(resourcePath) {
    nodeWorker = new Worker(`./src/js/viewers/node-viewer/NodeWorker.js`);

    nodeWorker.on("error", (e) => {
        console.log(e); throw new Error(`${e.message} on line ${e.lineno}`);
    });
    nodeWorker.on("messageerror", (e) => {
        console.log(e); throw new Error(`${e.message} on line ${e.lineno}`);
    });
    nodeWorker.on("message", (data) => {
        switch (data.message) {
            case "NODES":
                parentPort.postMessage({
                    "message": "NODES",
                    "data": data.data
                });
                break;
        }
    })

    nodeWorker.postMessage({
        "message": "init",
        "data": resourcePath
    });


    domWorker = new Worker(`./src/js/viewers/node-viewer/DomWorker.js`);

    domWorker.on("error", (e) => {
        console.log(e); throw new Error(`${e.message} on line ${e.lineno}`);
    });
    domWorker.on("messageerror", (e) => {
        console.log(e); throw new Error(`${e.message} on line ${e.lineno}`);
    });
    domWorker.on("message", (data) => {
        switch (data.message) {
            case "DomElements":
                parentPort.postMessage({
                    "message": "DomElements",
                    "data": data.data
                });
                break;
        }
    });

    domWorker.postMessage({
        "message": "init",
        "data": resourcePath
    });


    protoWorker = new Worker(`./src/js/viewers/node-viewer/PrototypeWorker.js`);

    protoWorker.on("error", (e) => {
        console.log(e); throw new Error(`${e.message} on line ${e.lineno}`);
    });
    protoWorker.on("messageerror", (e) => {
        console.log(e); throw new Error(`${e.message} on line ${e.lineno}`);
    });
    protoWorker.on("message", (data) => {
        switch (data.message) {
            case "PROTO":
                parentPort.postMessage({
                    "message": "PROTO",
                    "data": data.data
                });
                break;
        }
    });

    protoWorker.postMessage({
        "message": "init",
        "data": resourcePath
    });
}

function loadNodes(torFiles) {
    domWorker.postMessage({
        "message": 'loadNodes',
        "data": torFiles[1]
    });
    nodeWorker.postMessage({
        "message": 'loadNodes',
        "data": torFiles[0]
    });
    protoWorker.postMessage({
        "message": 'loadNodes',
        "data": torFiles[0]
    });
}