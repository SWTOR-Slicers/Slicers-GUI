const path = require('path');

const cache = {
    "srcPath": ""
}

let domWorker;
let nodeWorker;
let protoWorker;

let loadPrototypes = true;

onmessage = (e) => {
    switch (e.data.message) {
        case "init":
            cache['srcPath'] = e.data.data[1];
            initSubWorkers(e.data.data[0]);
            break;
        case "loadNodes":
            if (!e.data.prots) {
                loadPrototypes = false;
            }
            loadNodes(e.data.data);
            break;
    }
}

function initSubWorkers(resourcePath) {
    nodeWorker = new Worker(path.join(cache['srcPath'], "js", "viewers", "node-viewer", "NodeWorker.js"), {
        type: "module"
    });

    nodeWorker.onerror = (e) => { console.log(e); throw new Error(`${e.message} on line ${e.lineno}`); }
    nodeWorker.onmessageerror = (e) => { console.log(e); throw new Error(`${e.message} on line ${e.lineno}`); }
    nodeWorker.onmessage = (e) => {
        switch (e.data.message) {
            case "NODES":
                postMessage({
                    "message": "NODES",
                    "data": e.data.data
                });
                break;
        }
    }

    nodeWorker.postMessage({
        "message": "init",
        "data": resourcePath
    });


    domWorker = new Worker(path.join(cache['srcPath'], "js", "viewers", "node-viewer", "DomWorker.js"), {
        type: "module"
    });

    domWorker.onerror = (e) => { console.log(e); throw new Error(`${e.message} on line ${e.lineno}`); }
    domWorker.onmessageerror = (e) => { console.log(e); throw new Error(`${e.message} on line ${e.lineno}`); }
    domWorker.onmessage = (e) => {
        switch (e.data.message) {
            case "DomElements":
                postMessage({
                    "message": "DomElements",
                    "data": e.data.data
                });
                break;
        }
    }

    domWorker.postMessage({
        "message": "init",
        "data": resourcePath
    });


    protoWorker = new Worker(path.join(cache['srcPath'], "js", "viewers", "node-viewer", "PrototypeWorker.js"), {
        type: "module"
    });

    protoWorker.onerror = (e) => { console.log(e); throw new Error(`${e.message} on line ${e.lineno}`); }
    protoWorker.onmessageerror = (e) => { console.log(e); throw new Error(`${e.message} on line ${e.lineno}`); }
    protoWorker.onmessage = (e) => {
        switch (e.data.message) {
            case "PROTO":
                postMessage({
                    "message": "PROTO",
                    "data": e.data.data
                });
                break;
        }
    }

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
    if (loadPrototypes) {
        protoWorker.postMessage({
            "message": 'loadNodes',
            "data": torFiles[0]
        });
    }
}