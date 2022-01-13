import { NodeEntr } from '../formats/Node.js';

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
        this.animNames = [];
        this.fxSpecNames = [];
        this.errors = [];
    }

    /**
     * parse cnv nodes for file names
     * @param  {Array<NodeEntr>} cnvNodes
     */
    parseCNVNodes(cnvNodes) {
        for (const cnvNode of cnvNodes) {
            const under = cnvNode.fqn.toLowerCase().replace('.', '_');
            const slash = cnvNode.fqn.toLowerCase().toString().replace('.', '/');
            const stb = "/resources/en-us/str/" + slash + ".stb";
            const acb = "/resources/en-us/bnk2/" + under + ".acb";
            const fxe = "/resources/en-us/fxe/" + slash + ".fxe";
            this.fileNames.push(stb);
            this.fileNames.push(acb);
            this.fileNames.push(fxe);

            //Check for alien vo files.
            if (cnvNode.fqn.startsWith("cnv.alien_vo")) this.fileNames.push("/resources/bnk2/" + under + ".acb");
            cnvNode.readNode();
            if (cnvNode.node.getField("cnvActionList")) {
                const actionData = cnvNode.node.getField("cnvActionList").value.list;
                if (actionData != null) {
                    for (const action of actionData) {
                        if (action.contains("stg.")) continue;
                        const as = action.split('.');
                        this.animNames.push(as[as.length - 1].toLowerCase());
                    }
                }
            }

            if (cnvNode.node.getField("cnvActiveVFXList")) {
                const vfxData = cnvNode.node.getField("cnvActiveVFXList");
                if (vfxData != null) {
                    for (const kvp of vfxData) {
                        const value = kvp.value;
                        if (value.length > 0) {
                            for (const vfx of value) {
                                this.fxSpecNames.push(vfx.toLowerCase());
                            }
                        }
                    }
                }
            }
        }
    }

    genHash() {
        const res = [...this.fileNames.map(file => file.replace("\\", "/")), ...this.animNames.map(file => file.replace("\\", "/")), ...this.fxSpecNames.map(file => file.replace("\\", "/"))];
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

        if (this.fxSpecNames.length > 0) {
            const outputFxSpecNames = fs.createWriteStream(`${this.#dest}\\File_Names\\${this.extension}_fxspec_names.txt`, {
                flags: 'a'
            });
            for (const file of this.fxSpecNames) {
                outputFxSpecNames.write(`${file.replace("\\", "/")}\r\n`);
            }
            outputFxSpecNames.end();
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

export {CNVParser};