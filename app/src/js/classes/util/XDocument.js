class XDocument {
    constructor(doc) {
        this.document = doc;
    }
    
    /**
     * searches elements for specified tag and returns it wrapped in an XDocument
     * @param  {string} search
     * @returns {XDocument}
     */
    element(search) {
        const elem = this.document.elements.find(v => { return v.type === "element" && v.name === search; });
        return elem ? new XDocument(elem) : elem;
    }
    
    /**
     * searches elements for specified tag and returns all matching elements as XDocuments
     * @param  {string} search
     * @returns {Array<XDocument>}
     */
    elements(search) {
        const elems = this.document.elements.filter(v => { return v.type === "element" && v.name === search; });
        return elems ? elems.map(e => { return XDocument(e); }) : elems;
    }
    
    /**
     * searches elements for specified tag and returns all matchind decendents as XDocuments
     * @param  {string} search
     * @returns {Array<XDocument>}
     */
    descendents(search) {
        const elems = this.document.elements.filter(v => { return v.type === "element" && v.name === search; });
        return elems ? elems.map(e => { return XDocument(e); }) : elems;
    }

    /**
     * Searches through the document's attributes and returns 
     * @param  {string} search attribute to grab
     * @returns {string}
     */
    attribute(search) { return this.document.elements.attributes[search]; }

    get value() { const node = this.document.elements.find(v => { return v.type === "text" }); return node ? node.text : node; }
    get name() { return this.document.name; }
    get elements() { return this.document.elements; }
    get attributes() { return this.document.attributes; }

    get hasElements() { return this.document.elements.length > 0; }
}

export { XDocument }