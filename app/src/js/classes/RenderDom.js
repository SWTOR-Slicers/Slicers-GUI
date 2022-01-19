const { Dom } = require("./Dom.js");

const { ipcRenderer } = require("electron");

class RenderDomFactory {
    static DOM;
    static getDom() {
        ipcRenderer.sendSync("subscribeDom");
        const jDom = ipcRenderer.sendSync("getDom");
        this.DOM = Dom.fromJSON(jDom);
        return this.DOM;
    }
}

const RenderDom = new Proxy(RenderDomFactory.getDom(), {
    set: (target, prop, val) => {
        if (prop.includes("Load")) {
            Reflect.set(target, prop, val);
        } else if (prop.includes("update_")) {
            const trueProp = prop.substring(7);

            Reflect.set(target, trueProp, val);
        } else {
            ipcRenderer.sendSync("domUpdate", {
                "prop": prop,
                "value": val
            });

            Reflect.set(target, prop, val);
        }

        return true;
    }
});

// render listeners
ipcRenderer.on("mainUpdated", (event, data) => {
    RenderDom[`update_${data.prop}`] = data.value;
});

export { RenderDom };