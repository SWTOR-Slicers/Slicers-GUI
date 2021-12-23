import { NodeEntr } from '../formats/Node.js';

const fs = require('fs');

class HYDParser {
    #dest;
    /**
     * HYD nodes parser class
     * @param  {string} dest destination for ouputted hashes
     * @param  {string} ext extentions to search
     */
     constructor(dest, ext) {
        this.#dest = dest;
        this.extension = ext;
        this.animFileNames = [];
        this.vfxFileNames = [];
        this.errors = [];
    }

    /**
     * parses the HYD nodes
     * @param  {Array<NodeEntr>} hydNodes
     */
    parseHYD(hydNodes) {
        for (const obj of hydNodes) {
            obj.readNode();
            const hydScriptMap = obj.obj.value["hydScriptMap"];
            if (hydScriptMap != null) {
                for (const scriptMapItem of hydScriptMap) {
                    const hydScriptBlocks = scriptMapItem.value["hydScriptBlocks"];
                    if (hydScriptBlocks != null) {
                        for (const hydScriptBlocksItem of hydScriptBlocks) {
                            const hydActionBlocks = hydScriptBlocksItem.value["hydActionBlocks"];
                            if (hydActionBlocks != null) {
                                for (const hydActionBlocksItem of hydActionBlocks) {
                                    const hydActions = hydActionBlocksItem.value["hydActions"];
                                    if (hydActions != null) {
                                        for (const hydActionsItem of hydActions) {
                                            const action = (hydActionsItem.value["hydAction"] ?? "");
                                            const value = (hydActionsItem.value["hydValue"] ?? "").toLowerCase();
                                            if (action.includes("Animation")) {
                                                this.animFileNames.push(value);
                                            } else if (action.includes("VFX")) {
                                                this.vfxFileNames.push(value);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    genHash() {
        const res = [...this.animFileNames.map(file => {
            if (file != "") {
                return file;
            }
        }),
        ...this.vfxFileNames.map(file => {
            if (file != "") {
                if (file.includes("art/")) {
                    const output = "/resources/" + file + ".fxspec";
                    return output.replace("//", "/").replace(".fxspec.fxspec", ".fxspec");
                } else {
                    const output = "/resources/art/fx/fxspec/" + file + ".fxspec";
                    return output.replace("//", "/").replace(".fxspec.fxspec", ".fxspec");
                }
            }
        })];
        this.animFileNames = [];
        this.vfxFileNames = [];
        return res;
    }

    writeFile() {
        if (!fs.existsSync(`${this.#dest}\\File_Names`)) fs.mkdirSync(`${this.#dest}\\File_Names`);
        if (this.animFileNames.length > 0) {
            const outputAnimFileNames = fs.createWriteStream(`${this.#dest}\\File_Names\\${this.extension}_anim_file_names.txt`, {
                flags: 'a'
            });
            for (const file of this.animFileNames) {
                if (file != "") outputAnimFileNames.write(file);
            }
            outputAnimFileNames.end();
            this.animFileNames = [];
        }

        if (this.vfxFileNames.length > 0) {
            const outputVfxFileNames = fs.createWriteStream(`${this.#dest}\\File_Names\\${this.extension}_fxspec_file_names.txt`, {
                flags: 'a'
            });
            for (const file of this.vfxFileNames) {
                if (file != "") {
                    if (file.includes("art/")) {
                        const output = "/resources/" + file + ".fxspec";
                        outputVfxFileNames.write(output.replace("//", "/").replace(".fxspec.fxspec", ".fxspec"));
                    } else {
                        const output = "/resources/art/fx/fxspec/" + file + ".fxspec";
                        outputVfxFileNames.write(output.replace("//", "/").replace(".fxspec.fxspec", ".fxspec"));
                    }
                }
            }
            outputVfxFileNames.end();
            this.vfxFileNames = [];
        }

        if (this.errors.length > 0) {
            const outputErrors = fs.createWriteStream(`${this.#dest}\\File_Names\\${this.extension}_error_list.txt`, {
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

export {HYDParser};