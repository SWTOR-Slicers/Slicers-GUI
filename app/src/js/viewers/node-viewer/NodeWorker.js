import {Node, NodeEntr} from "../../classes/Node.js";

onmessage = (e) => {
    switch (e.message) {
        case "nodeEntr":
            const data = e.data
            const nodeStr = data[0];
            const nodes = nodeStr.split('\n');
            for (let i = 0; i < nodes.length; i++) {
                if (nodes[i] != "") {
                    if (nodes[i].indexOf('{') > -1) {
                        const node = new NodeEntr(JSON.parse(nodes[i]), data[1]);
                        postMessage({
                            "message": 'finishedEntr',
                            "data": data
                        })
                    } else {
                        // its a progress update
                    }
                }
            }
            break;
    }
}