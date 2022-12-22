import { NodeEntr } from "../../classes/formats/Node.js";
import { GomTree, nodeFolderSort } from "./GomTree.js";

const path = require('path');
const fs = require('fs');

const cache = {
    "configPath": "",
    "store": {}
}

let GTree;
let _dom = null;

onmessage = (e) => {
    switch (e.data.message) {
        case "init":
            GTree = new GomTree();
            cache['configPath'] = path.normalize(path.join(e.data.data, "config.json"));
            break;
        case "setDOM":
            _dom = e.data.data;
            break;
        case "nodesProgress":
            if (e.data.data.isBkt) {
                for (const n of e.data.data.nodes) {
                    const node = new NodeEntr(n.node, n.torPath, _dom);
                    GTree.addNode(node);
                }
                GTree.loadedBuckets++;
                GTree.nodesByFqn.$F.sort(nodeFolderSort);
            } else {
                for (const n of e.data.data.nodes) {
                    const testProto = new NodeEntr(n.node, n.torPath, _dom);
                    GTree.addNode(testProto);
                }
                GTree.nodesByFqn.$F.sort(nodeFolderSort);
            }
            break;
        case "extractSubtree":
            extractSubtree(e.data.data.outputDir, e.data.data.outputType, e.data.data.targetFqn)
            break;
    }
}

async function extractSubtree(outDir, type, targetFqn) {
    console.log(outDir, type, targetFqn);
    const fileExt = type == "raw" ? "node" : type;

    const nodes = GTree.nodesByFqn.getObjectsStartingWith(targetFqn.concat("."));
    let extrNodes = 0;

    await Promise.all(nodes.map((node) => {
        const segs = node.fqn.split('.');
        const fileName = `${segs.pop()}.${fileExt}`;
        const dirPath = path.join(outDir, segs.join(path.sep));

        fs.mkdirSync(dirPath, {recursive: true});

        node.readNode();
        node.node.extract(dirPath, type, fileName);

        extrNodes++;
        if (nodes.length > 1000 && extrNodes % 50 == 0) {
            postMessage({
                "message": "progress",
                "data": {
                    "loaded": extrNodes,
                    "total": nodes.length
                }
            });
        } else {
            postMessage({
                "message": "progress",
                "data": {
                    "loaded": extrNodes,
                    "total": nodes.length
                }
            });
        }
    }));

    postMessage({
        "message": "complete",
        "data": {
            "loaded": nodes.length,
            "total": nodes.length
        }
    });
}