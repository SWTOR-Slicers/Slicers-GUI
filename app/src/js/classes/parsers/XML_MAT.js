import { XDocument } from '../util/XDocument.js';

const fs = require('fs');

class XML_MAT {
    #dest;
    /**
     * XML_MAT parser class
     * @param  {string} dest destination for ouputted hashes
     * @param  {string} ext extentions to search
     */
    constructor(dest, ext) {
        this.#dest = dest;
        this.extension = ext;
        this.fileNames = [];
        this.animNames = [];
        this.errors = [];
    }
    /**
     * parses an XML material file
     * @param  {XDocument} doc
     * @param  {string} fullFileName
     * @param  {string} baseFolder
     */
    parseXML(doc, fullFileName, baseFolder = null) {
        const fileName = fullFileName.substring(fullFileName.lastIndexOf('\\') + 1);
        const directory = fullFileName.substring(0, fullFileName.lastIndexOf('/'));

        try {
            if (fileName.includes("am_")) {
                const temp = fileName.split('/').at(-1);
                const fileNameNoExtension = temp.substring(3, (temp.indexOf('.') - 3));
                let fullDirectory = "";
                if (baseFolder != null) {
                    fullDirectory = `/resources/${baseFolder}`;
                } else {
                    fullDirectory = directory + '/' + fileNameNoExtension + '/';
                }
                const aamElement = doc.element("aam");
                if (aamElement == null) return;
                const actionElement = aamElement.element("actions");
                if (actionElement != null) {
                    const actionList = actionElement.elements("action");

                    for (const action of actionList) {
                        let actionName = action.name;
                        if (action.attribute("actionProvider") != null) {
                            const actionProvider = action.attribute("actionProvider") + ".mph";
                            if (fullDirectory.includes("/humanoid/humanoid/")) {
                                this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfanew/") + actionProvider);
                                this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfanew/") + actionProvider + ".amx");
                                this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfbnew/") + actionProvider);
                                this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfnnew/") + actionProvider);
                                this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfnnew/") + actionProvider + ".amx");
                                this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfsnew/") + actionProvider);
                                this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfsnew/") + actionProvider + ".amx");

                                this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmanew/") + actionProvider);
                                this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmanew/") + actionProvider + ".amx");
                                this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmfnew/") + actionProvider);
                                this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmfnew/") + actionProvider + ".amx");
                                this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmnnew/") + actionProvider);
                                this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmnnew/") + actionProvider + ".amx");
                                this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmsnew/") + actionProvider);
                                this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmsnew/") + actionProvider + ".amx");
                            } else {
                                this.animNames.push(fullDirectory + actionProvider);
                                this.animNames.push(fullDirectory + actionProvider + ".amx");
                            }
                        }
                        if (action.attribute("animName") != null) {
                            const animationName = action.attribute("animName");
                            if (actionName != animationName) {
                                animationName += ".jba";
                                if (fullDirectory.includes("/humanoid/humanoid/")) {
                                    this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfanew/") + animationName);
                                    this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfbnew/") + animationName);
                                    this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfnnew/") + animationName);
                                    this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfsnew/") + animationName);

                                    this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmanew/") + animationName);
                                    this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmfnew/") + animationName);
                                    this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmnnew/") + animationName);
                                    this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmsnew/") + animationName);
                                } else {
                                    this.animNames.push(fullDirectory + animationName);
                                }
                            }
                        }
                        actionName += ".jba";
                        if (fullDirectory.includes("/humanoid/humanoid/")) {
                            this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfanew/") + actionName);
                            this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfbnew/") + actionName);
                            this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfnnew/") + actionName);
                            this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfsnew/") + actionName);

                            this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmanew/") + actionName);
                            this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmfnew/") + actionName);
                            this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmnnew/") + actionName);
                            this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmsnew/") + actionName);
                        } else {
                            this.animNames.push(fullDirectory + actionName);
                        }
                    }
                }

                const networkElem = aamElement.element("networks");
                if (networkElem != null) {
                    const networkList = networkElem.descendents("literal");
                    for (const network of networkList) {
                        const fqnName = network.attribute("fqn");
                        if (fqnName != null) {
                            if (fullDirectory.includes("/humanoid/humanoid/")) {
                                this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfanew/") + fqnName);
                                this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfanew/") + fqnName + ".amx");
                                this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfbnew/") + fqnName);
                                this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfbnew/") + fqnName + ".amx");
                                this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfnnew/") + fqnName);
                                this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfnnew/") + fqnName + ".amx");
                                this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfsnew/") + fqnName);
                                this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfsnew/") + fqnName + ".amx");

                                this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmanew/") + fqnName);
                                this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmanew/") + fqnName + ".amx");
                                this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmfnew/") + fqnName);
                                this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmfnew/") + fqnName + ".amx");
                                this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmnnew/") + fqnName);
                                this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmnnew/") + fqnName + ".amx");
                                this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmsnew/") + fqnName);
                                this.animNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmsnew/") + fqnName + ".amx");
                            } else {
                                this.animNames.push(fullDirectory + fqnName);
                                this.animNames.push(fullDirectory + fqnName + ".amx");
                            }
                        }
                    }
                }
            } else {
                for (const node of doc.childElements) {
                    this.nodeChecker(node);
                }
            }
        } catch (e) {
            this.errors.push("File: " + e.name);
            this.errors.push(e.message + ":");
            this.errors.push(e.stack);
            this.errors.push("");
        }
    }
    /**
     * @param  {XDocument} node
     */
    nodeChecker(node) {
        if (node.hasElements) {
            for (const childnode of node.elems) {
                if (childnode.name == "input" && childnode.element("type") != null) {
                    const type = childnode.element("type").value; //new way of searching for texture file names
                    if (type == "texture") {
                        const textureName = childnode.element("value").value;
                        if (textureName != null && textureName != "") {
                            const scrubbedName = textureName.replace("////", "//").replace("\\art", "art").replace(" #", "").replace("#", "").replace("+", "/").replace(" ", "_");
                            this.fileNames.push("\\resources\\" + scrubbedName + ".dds");
                            this.fileNames.push("\\resources\\" + scrubbedName + ".tex");
                            this.fileNames.push("\\resources\\" + scrubbedName + ".tiny.dds");
                            const fileName = scrubbedName.split('\\');
                            let startPosition = 0;
                            if (scrubbedName.includes('\\')) startPosition = scrubbedName.lastIndexOf('\\') + 1;
                            let length = scrubbedName.length - startPosition;
                            const tagsToRemove = ["_d", "_n", "_s" ];

                            if (tagsToRemove.some(name => scrubbedName.endsWith(name))) length -= 2;

                            const primaryName = scrubbedName.substring(startPosition, length);
                            this.fileNames.push(`\\resources\\art\\shaders\\materials\\${primaryName}.mat`);
                        }
                    }
                }
                const fxSpecList = childnode.elements("fxSpecString");
                if (childnode.name == "AppearanceAction" && fxSpecList.length > 0) {
                    for (const fxSpec of fxSpecList) {
                        const fxSpecName = "\\resources\\art\\fx\\fxspec\\" + fxSpec;
                        if (!fxSpec.toLowerCase().endsWith(".fxspec")) fxSpecName += ".fxspec";
                        this.fileNames.push(fxSpecName);
                    }
                }
                if (childnode.name == "Asset") {
                    const assetFilenames = this.#assetReader(childnode);
                    for (const name of assetFilenames) {
                        const scrubbedName = name.replace("////", "//").replace(" #", "").replace("#", "").replace("+", "/").replace(" ", "_");
                        this.fileNames.push(scrubbedName);
                    }
                } else {
                    this.nodeChecker(childnode);
                }
            }
        }
    }

    genHash() {
        const res = [...this.fileNames.map(file => file.replace("\\", "/")), ...this.animNames.map(file => file.replace("\\", "/"))];
        return res;
    }

    writeFile() {
        if (!fs.existsSync(`${this.#dest}\\File_Names`)) fs.mkdirSync(`${this.#dest}\\File_Names`);
        if (this.fileNames.length > 0) {
            const outputNames = fs.createWriteStream(`${this.#dest}\\File_Names\\${this.extension}_file_names.txt`, {
                flags: 'a'
            });
            for (const file of this.fileNames) {
                outputNames.write(`${file.replace("\\", "/")}\r\n`);
            }
            outputNames.end();
        }

        if (this.animNames.length > 0) {
            const outputAnimNames = fs.createWriteStream(`${this.#dest}\\File_Names\\${this.extension}_anim_file_names.txt`, {
                flags: 'a'
            });
            for (const file of this.animNames) {
                outputAnimNames.write(`${file.replace("\\", "/")}\r\n`);
            }
            outputAnimNames.end();
        }

        if (this.errors.length > 0) {
            const outputErrors = fs.createWriteStream(`${this.#dest}\\File_Names\\${this.extension}_error_list.txt`, {
                flags: 'a'
            });
            for (const error of this.errors) {
                outputErrors.write(`${error}\r\n`);
            }
            outputErrors.end();
        }
    }

    /**
     * Searches through provided xml element and generates a file list.
     * @param  {Node} childnode the xml element
     */
    #assetReader(childnode) {
        const fileList = [];
        /**
         * Util function to increase code readability
         * @param  {string} elem string to check
         * @param  {boolean} hasBodyTypes whether or not there are body types
         */
        const btUtil = (elem, hasBodyTypes) => {
            if (elem.includes("[bt]") && hasBodyTypes) { //Checking if we need to create file names for each bodytype.
                fileList.concat(this.#bodyType(bodyTypeList, elem));
            } else {
                genUtil(elem);
            }
        }
        /**
         * Util function to increase code readability
         * @param  {string} elem string to check
         */
        const genUtil = (elem) => {
            if (elem.includes("[gen]")) { // Checking for gender specific file names
                fileList.concat(this.#genderize(elem));
            } else {
                fileList.push("/resources" + elem);
            }
        }

        if (childnode.element("BaseFile") != null) {
            const basefile = childnode.element("BaseFile");
            let hasBodyTypes = false;
            let bodyTypeT = (childnode.element("BodyTypes") != null);
            let bodyTypet = (childnode.element("Bodytypes") != null);

            if (bodyTypeT) { hasBodyTypes = childnode.element("BodyTypes").hasElements; }
            if (bodyTypet) { hasBodyTypes = childnode.element("Bodytypes").hasElements; }
            if (hasBodyTypes) {
                let bodyTypeList = [];
                if (bodyTypeT) {
                    bodyTypeList = childnode.element("BodyTypes").elems.map(c => c.value);
                } else {
                    bodyTypeList = childnode.element("Bodytypes").elems.map(c => c.value);
                }
                if (childnode.element("BaseFile") != "") {
                    btUtil(basefile, hasBodyTypes);
                }

                const materials = childnode.element("Materials").elems;
                if (materials != null) { //check for material file names.
                    for (const material of materials) {
                        const filename = material.getAttribute("filename");
                        btUtil(filename, hasBodyTypes);

                        const matoverrides = material.element("MaterialOverrides").childElements;
                        if (matoverrides != null) {
                            for (const over of matoverrides) {
                                const override_filename = over.getAttribute("filename");
                                btUtil(override_filename, hasBodyTypes);
                            }
                        }
                    }
                }

                const attachments = childnode.element("Attachments").elems;
                if (attachments != null) { //check for attachment model file names.
                    for (const attachment of attachments) {
                        const filename = attachment.getAttribute("filename");
                        btUtil(filename, hasBodyTypes);
                    }
                }
            } else {
                if (childnode.element("BaseFile") != "") {
                    genUtil(basefile);
                }

                const materials = childnode.element("Materials").elems;
                if (materials != null) { //check for material file names.
                    for (const material of materials) {
                        const filename = material.getAttribute("filename");
                        genUtil(filename);
                    }
                }

                const attachments = childnode.element("Attachments").elems;
                if (attachments != null) { //check for attachment model file names.
                    for (const attachment of attachments) {
                        const filename = attachment.getAttribute("filename");
                        genUtil(filename);
                    }
                }
            }
        }
        return fileList;
    }

    #genderize(filename) {
        const fileList = [];
        const genders = ["m", "f", "u"];

        for (const gender of genders) {
            const genderFileName = filename.replace("[gen]", gender);
            fileList.push("/resources" + genderFileName);
        }

        return fileList;
    }

    #bodyType(bodyTypeList, filename) {
        const fileList = [];

        for (const bodytype of bodyTypeList) {
            const bodyTypeFileName = filename.replace("[bt]", bodytype);
            fileList.push("/resources" + bodyTypeFileName);
        }

        return fileList;
    }
}

export { XML_MAT }