const { Worker, parentPort } = require("worker_threads");

let domWorker;
let nodeWorker;
let protoWorker;
let devBuild;

parentPort.on("message", (data) => {
    switch (data.message) {
        case "init":
            devBuild = data.devBuild;
            initSubWorkers(data.data);
            break;
        case "loadNodes":
            loadNodes(data.data);
            break;
    }
});

function initSubWorkers(resourcePath) {
    domWorker = new Worker(`${devBuild ? "./src/js/viewers/node-viewer/DomWorker.js" : "./resources/app/src/js/viewers/node-viewer/DomWorker.js"}`);

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


    nodeWorker = new Worker(`${devBuild ? "./src/js/viewers/node-viewer/NodeWorker.js" : "./resources/app/src/js/viewers/node-viewer/NodeWorker.js"}`);

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


    protoWorker = new Worker(`${devBuild ? "./src/js/viewers/node-viewer/PrototypeWorker.js" : "./resources/app/src/js/viewers/node-viewer/PrototypeWorker.js"}`);

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
    
    setTimeout(() => {
        nodeWorker.postMessage({
            "message": 'loadNodes',
            "data": torFiles[0]
        });
        protoWorker.postMessage({
            "message": 'loadNodes',
            "data": torFiles[0]
        });
    }, 1100);
}