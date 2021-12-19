import {Node} from '../formats/Node.js';
import { XDocument } from '../util/XDocument';

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
        let _ = fullName.substring(fullName.lastIndexOf('\\') + 1);
        _ = fullName.substring(0, fullName.lastIndexOf('/'));

        try {
            const anode = doc.element("Appearance");
            const file = "/resources/gamedata/" + anode.attribute("fqn").replace('.', '/') + ".epp";
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
     * @param  {Array<Node>} eppNodes
     */
    parseEPPNodes(eppNodes) {
        for (const obj of eppNodes) {
            const slash = obj.fqn.toLowerCase().replace('.', '/');
            const epp = "/resources/gamedata/" + slash + ".epp";
            this.fileNames.push(epp);
        }
    }

    writeFile() {
        if (!fs.existsSync(`${this.#dest}\\File_Names`)) fs.mkdirSync(`${this.#dest}\\File_Names`);
        if (this.fileNames.length > 0) {
            const outputNames = fs.createWriteStream(`${this.#dest}\\File_Names\\${extension}_file_names.txt`, {
                flags: 'a'
            });
            for (const file of this.fileNames) {
                outputNames.write(`${file.replace("\\", "/")}\r\n`);
            }
            outputNames.end();
            this.fileNames = [];
        }

        if (this.animNames.length > 0) {
            const outputAnimNames = fs.createWriteStream(`${this.#dest}\\File_Names\\${extension}_anim_file_names.txt`, {
                flags: 'a'
            });
            for (const file of this.animNames) {
                outputAnimNames.write(`${file.replace("\\", "/")}\r\n`);
            }
            outputAnimNames.end();
            this.animNames = [];
        }

        if (errors.length > 0) {
            const outputErrors = fs.createWriteStream(`${this.#dest}\\File_Names\\${extension}_error_list.txt`, {
                flags: 'a'
            });
            for (const error of errors) {
                outputErrors.write(`${error}\r\n`);
            }
            outputErrors.end();
            this.errors = [];
        }
    }
}

export {EPPParser}