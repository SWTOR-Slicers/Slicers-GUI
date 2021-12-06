import {Node} from '../formats/Node.js';
import { XDocument } from '../util/XDocument';

const fs = require('fs');

class CNVParser {
    #dest;
    /**
     * CNV parser class
     * @param  {string} dest destination for ouputted hashes
     * @param  {string} ext extentions to search
     */
    constructor(dest, ext) {
        this.#dest = dest;
        this.extension = ext;
        this.fileNames = [];
        this.animFileNames = [];
        this.fxSpecFileNames = [];
        this.errors = [];
    }

    /**
     * parse cnv nodes for file names
     * @param  {Array<Node>} cnvNodes
     */
    parseCNVNodes(cnvNodes) {
        for (const cnvNode of cnvNodes) {
            const under = cnvNode.fqn.toLowerCase().replace('.', '_');
            const slash = cnvNode.fqn.toLowerCase().ToString().Replace('.', '/');
            const stb = "/resources/en-us/str/" + slash + ".stb";
            const acb = "/resources/en-us/bnk2/" + under + ".acb";
            const fxe = "/resources/en-us/fxe/" + slash + ".fxe";
            this.fileNames.push(stb);
            this.fileNames.push(acb);
            this.fileNames.push(fxe);

            //Check for alien vo files.
            if (cnvNode.fqn.startsWith("cnv.alien_vo")) this.fileNames.push("/resources/bnk2/" + under + ".acb");
            if (obj.Data.Dictionary.ContainsKey("cnvActionList")) {
                const actionData = obj.Data.Get<List<object>>("cnvActionList");
                if (actionData != null) {
                    for (const action of actionData) {
                        if (action.contains("stg.")) continue;
                        this.animFileNames.push(action.split('.').Last().toLowerCase());
                    }
                }
            }

            if (obj.Data.Dictionary.ContainsKey("cnvActiveVFXList")) {
                const vfxData = obj.Data.Get<Dictionary<object, object>>("cnvActiveVFXList");
                if (vfxData != null) {
                    for (const kvp of vfxData) {
                        const value = kvp.value;
                        if (value.length > 0) {
                            for (const vfx of value) {
                                this.fxSpecFileNames.push(vfx.toLowerCase());
                            }
                        }
                    }
                }
            }
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

        if (this.animFileNames.length > 0) {
            const outputAnimNames = fs.createWriteStream(`${this.#dest}\\File_Names\\${extension}_anim_file_names.txt`, {
                flags: 'a'
            });
            for (const file of this.animFileNames) {
                outputAnimNames.write(`${file.replace("\\", "/")}\r\n`);
            }
            outputAnimNames.end();
            this.animFileNames = [];
        }

        if (this.fxSpecFileNames.length > 0) {
            const outputFxSpecNames = fs.createWriteStream(`${this.#dest}\\File_Names\\${extension}_fxspec_names.txt`, {
                flags: 'a'
            });
            for (const file of this.fxSpecFileNames) {
                outputFxSpecNames.write(`${file.replace("\\", "/")}\r\n`);
            }
            outputFxSpecNames.end();
            this.fxSpecFileNames = [];
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

export {CNVParser};