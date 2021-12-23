import { XDocument } from "../util/XDocument.js";

class MapNoteData {
    #mpn;
    #mpnB62Id;

    /**
     * A class representing the mapNoteData data object model
     * @param  {Object} dom the data object model
     * @param  {XDocument} node the XDocument representation of the node associated with this mapNoteData object
     */
    constructor(dom, node) {
        this.dom = dom;
        this.positionX = null;
        this.positionY = null;
        this.positionZ = null;
        this.rotation = null;
        this.mapTags = null;
        this.parentMapTag = null;
        this.showGhosted = null;
        this.showOffmapArrow = null;
        this.showQuestBreadcrumbOnly = null;
        this.doNotBreadcrumb = null;
        this.ignoreFoW = null;
        this.templateFQN = null;

        this.load(node);
    }
    
    get mpnB62Id() {
        throw new Error("Base62 DB implimintation missing. its on the TODO");
        if (this.mpnB62Id_ == null) {
            const obj = this.dom.getObjectNoLoad(this.templateFQN);
            if (obj != null) {
                return obj.id.toMaskedBase62();
            }
        }
        return null;
    }

    get mpn() {
        if (this.#mpn == null) {
            const obj = this.dom.getObject(this.templateFQN);
            if (obj != null) this.#mpn = this.load(obj);
        }
        return this.#mpn;
    }

    /**
     * loads this mapNoteData
     * @param  {XDocument} node
     * @returns  {MapNote}
     */
    load(node) {
        for (const f of node.elems) {
            const attrib = f.attribute("name");
            if (!f.hasAttributes || attrib == null) continue;
            switch (attrib) {
                case "mpnPosition":
                    const temp_vec = f.value.substring(1, f.value.length - 2);
                    const split = temp_vec.split(',');
                    if (split.length == 3) {
                        this.positionX = split[0];
                        this.positionY = split[1];
                        this.positionZ = split[2];
                    }
                    break;
                case "mpnRotation":
                    const rotsplit = f.value.split(',');
                    if (rotsplit.length == 3) {
                        this.rotation = rotsplit[1];
                    }
                    break;
                case "mpnMapTags":
                    this.mapTags = new Map();
                    for (const m = 0; m < f.elems.length; m += 2) {
                        const elems = f.elems;
                        const k = elems[m];
                        const e = elems[m+1];
                        this.mapTags.set(k.value, new Boolean(e.value));
                    }
                    break;
                case "ParentMapTag":
                    this.parentMapTag = f.value;
                    break;
                case "ShowGhosted":
                    this.showGhosted = new Boolean(f.value);
                    break;
                case "ShowOffmapArrow":
                    this.showOffmapArrow = new Boolean(f.value);
                    break;
                case "ShowQuestBreadcrumbOnly":
                    this.showQuestBreadcrumbOnly = new Boolean(f.value);
                    break;
                case "DoNotBreadcrumb":
                    this.doNotBreadcrumb = new Boolean(f.value);
                    break;
                case "mpnIgnoreFoW":
                    this.ignoreFoW = new Boolean(f.value);
                    break;
                case "mpnTemplateFQN":
                    const fqn = f.value.replace("\\server\\mpn\\", "mpn.").replace(".mpn", "").replace("\\", ".");
                    this.templateFQN = fqn;
                    //const objId = _dom.GetObjectId(fqn);
                    //if(objId != null)
                    //{
                    //    //this.MPN = (MapNote)GameObject.Load(obj);
                    //}
                    break;
            }
        }
        return this;
    }
}

export {MapNoteData};