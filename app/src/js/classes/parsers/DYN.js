import { NodeEntr } from '../formats/Node.js';

const fs = require('fs');

class DYNParser {
    /**
     * DYN nodes parser class
     * @param  {string} dest destination for ouputted hashes
     * @param  {string} ext extentions to search
     */
     constructor(dest, ext) {
        this.#dest = dest;
        this.extension = ext;
        this.fileNames = [];
        this.unknownFileNames = [];
        this.errors = [];
    }

    /**
     * parses the DYN nodes
     * @param  {Array<NodeEntr>} dynNodes
     */
    parseDYN(dynNodes) {
        for (const obj of dynNodes) {
            obj.readNodes();
            const dynVisualList = obj.obj.value["dynVisualList"];
            if (dynVisualList != null) {
                for (const dynVisualListItem of dynVisualList) {
                    const visual = (dynVisualListItem.value["dynVisualFqn"] || "").toLowerCase();
                    if (visual != "") {
                        const output = visual.replace("\\", "/").replace("//", "/");
                        if (visual.contains(".gr2") || visual.contains(".lit") || visual.contains(".mag")) {
                            output = ("/resources/" + output).replace("//", "/");
                        } else if (visual.contains(".fxspec")) {
                            output = ("/resources/art/fx/fxspec/" + output).replace("//", "/");
                        } else if (visual.contains(".fxp")) {
                            output = ("/resources/art/fx/fxspec/" + output).replace("//", "/");
                        } else {
                            this.unknownFileNames.push(visual);
                        }

                        this.fileNames.push(output);
                    }
                }
            }

            const dynLightNameToProperty = obj.obj.value["dynLightNameToProperty"];
            if (dynLightNameToProperty != null) {
                for (const dynLightNameToPropertyItem of dynLightNameToProperty) {
                    const ramp = (dynLightNameToPropertyItem.value["dynLightRampMap"] || "").toLowerCase();
                    const illum = (dynLightNameToPropertyItem.value["dynLightIlluminationMap"] || "").toLowerCase();
                    const fall = (dynLightNameToPropertyItem.value["dynLightFalloff"] || "").toLowerCase();
                    if (ramp != "") this.fileNames.push("/resources/" + ramp + ".dds");
                    if (illum != "") this.fileNames.push("/resources/" + illum + ".dds");
                    if (fall != "") this.fileNames.push("/resources/" + fall + ".dds");
                }
            }
        }
    }

    genHash() {
        const res = [...this.fileNames.map(file => {
            if (file != "") {
                return file;
            }
        }),
        ...this.unknownFileNames.map(file => {
            if (file != "") {
                return file;
            }
        })];
        return res;
    }

    writeFile() {
        if (!fs.existsSync(`${this.#dest}\\File_Names`)) fs.mkdirSync(`${this.#dest}\\File_Names`);
        if (this.fileNames.length > 0) {
            const outputFileNames = fs.createWriteStream(`${this.#dest}\\File_Names\\${this.extension}_file_names.txt`, {
                flags: 'a'
            });
            for (const file of this.fileNames) {
                if (file != "") outputFileNames.write(file);
            }
            outputFileNames.end();
        }

        if (this.unknownFileNames.length > 0) {
            const outputUnknownFileNames = fs.createWriteStream(`${this.#dest}\\File_Names\\${this.extension}_unknown_file_names.txt`, {
                flags: 'a'
            });
            for (const file of this.unknownFileNames) {
                if (file != "") {
                    outputUnknownFileNames.write(file);
                }
            }
            outputUnknownFileNames.end();
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

export {DYNParser};