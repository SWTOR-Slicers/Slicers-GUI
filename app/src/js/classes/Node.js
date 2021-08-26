import {GOM} from "./util/Gom.js";

class Node {
    constructor(data) {
        
    }

    render(parent) {

    }
}

class NodeEntr {
    constructor(nodeJson, torPath) {
        this.id = nodeJson.id;
        this.fqn = nodeJson.fqn;
        this.baseClass = nodeJson.baseClass;
        this.bkt = nodeJson.bkt
        this.isBucket = nodeJson.isBucket;
        this.dataOffset = nodeJson.dataOffset;
        this.dataLength = nodeJson.dataLength;
        this.contentOffset = nodeJson.contentOffset;
        this.uncomprLength = nodeJson.uncomprLength;
        this.streamStyle = nodeJson.streamStyle;
        this.torPath = torPath;
    }

    render(parent) {
        console.log(parent);
    }
}

export {Node, NodeEntr}