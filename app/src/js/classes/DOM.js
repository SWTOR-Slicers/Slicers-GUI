class Dom {
    #singletonTestProp;
    #archives;
    #_dom;
    #nodes;
    #protos;

    #archiveLoad;
    #_domLoad;
    #nodeLoad;
    #protoLoad;

    constructor() {
        this.#singletonTestProp = "notLoaded";
        // assets
        this.#archives = [];

        // GOM Tree
        this.#_dom = {};
        this.#nodes = [];
        this.#protos = [];

        // status props
        this.#archiveLoad = "0.0%";
        this.#_domLoad = "0.0%";
        this.#nodeLoad = "0.0%";
        this.#protoLoad = "0.0%";
    }

    get singletonTestProp() {
        return this.#singletonTestProp;
    }

    get archives() {
        return this.#archives;
    }

    load(torFiles) {
        this.#singletonTestProp = "Loaded";
        this.#archives.push("test");
    }

    getStatus(field) {

    }
}

module.exports = {
    "DOM_Factory": DOM_Factory
}