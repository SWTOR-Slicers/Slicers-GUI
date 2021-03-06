import { NodeEntr } from '../formats/Node.js';
import { XDocument } from '../util/XDocument.js';

const fs = require('fs');

class EPPParser {
    #dest;
    /**
     * EPP parser class
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
     * parses an EPP file
     * @param  {XDocument} doc
     * @param  {string} fullName
     */
    parseEPP(doc, fullName) {
        try {
            const anode = doc.element("Appearance");
            const file = "/resources/gamedata/" + anode.attribute("fqn").replaceAll('.', '/') + ".epp";
            this.fileNames.push(file);

            let elemList = doc.elements("fxSpecString");
            for (const node of elemList) {
                const fxspec = node.value;
                fxspec = "/resources/art/fx/fxspec/" + fxspec + ".fxspec";
                this.fileNames.push(fxspec);
            }

            elemList = doc.elements("projectileFXString");
            for (const node of elemList) {
                const fxspec = node.value;
                fxspec = "/resources/art/fx/fxspec/" + fxspec + ".fxspec";
                this.fileNames.push(fxspec);
            }

            elemList = doc.elements("casterAnim");
            for (const node of elemList) {
                const anim = node.value;
                this.animNames.push(anim);
            }

            elemList = doc.elements("targetAnim");
            for (const node of elemList) {
                const anim = node.value;
                this.animNames.push(anim);
            }

        } catch (e) {
            this.errors.Add("File: " + fullName);
            this.errors.Add(e.message + ":");
            this.errors.Add(e.stack);
            this.errors.Add("");
        }
    }
    /**
     * parse epp nodes for file names
     * @param  {Array<NodeEntr>} eppNodes
     */
    parseEPPNodes(eppNodes) {
        for (const obj of eppNodes) {
            obj.readNode();
            const slash = obj.fqn.toLowerCase().replaceAll('.', '/');
            const epp = "/resources/gamedata/" + slash + ".epp";
            this.fileNames.push(epp);
        }
    }

    genHash() {
        const res = [...this.fileNames.map(file => file.replaceAll("\\", "/")), ...this.animNames.map(file => file.replaceAll("\\", "/"))];
        return res;
    }

    writeFile() {
        if (!fs.existsSync(`${this.#dest}\\File_Names`)) fs.mkdirSync(`${this.#dest}\\File_Names`);
        if (this.fileNames.length > 0) {
            const outputNames = fs.createWriteStream(`${this.#dest}\\File_Names\\${this.extension}_file_names.txt`, {
                flags: 'a'
            });
            for (const file of this.fileNames) {
                outputNames.write(`${file.replaceAll("\\", "/")}\r\n`);
            }
            outputNames.end();
        }

        if (this.animNames.length > 0) {
            const outputAnimNames = fs.createWriteStream(`${this.#dest}\\File_Names\\${this.extension}_anim_file_names.txt`, {
                flags: 'a'
            });
            for (const file of this.animNames) {
                outputAnimNames.write(`${file.replaceAll("\\", "/")}\r\n`);
            }
            outputAnimNames.end();
        }

        if (this.errors.length > 0) {
            const outputErrors = fs.createWriteStream(`${this.#dest}\\File_Names\\${this.extension}_error_list.txt`, {
                flags: 'a'
            });
            for (const error of errors) {
                outputErrors.write(`${error}\r\n`);
            }
            outputErrors.end();
        }
    }
}

export {EPPParser}