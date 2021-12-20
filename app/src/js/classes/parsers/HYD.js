import { Node } from '../formats/Node';


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
     * @param  {Array<Node>} hydNodes
     */
    parseHYD(hydNodes) {
        for (const obj of hydNodes) {
            const hydScriptMap = obj.Data["hydScriptMap"];
            if (hydScriptMap != null) {
                for (const scriptMapItem of hydScriptMap) {
                    const scriptMapItem2 = scriptMapItem.value;
                    const hydScriptBlocks = scriptMapItem2["hydScriptBlocks"];
                    if (hydScriptBlocks != null) {
                        for (const hydScriptBlocksItem of hydScriptBlocks) {
                            const hydActionBlocks = hydScriptBlocksItem["hydActionBlocks"];
                            if (hydActionBlocks != null) {
                                for (const hydActionBlocksItem of hydActionBlocks) {
                                    const hydActions = hydActionBlocksItem["hydActions"];
                                    if (hydActions != null) {
                                        for (const hydActionsItem of hydActions) {
                                            const action = (hydActionsItem["hydAction"] || "");
                                            const value = (hydActionsItem["hydValue"] || "").toLowerCase();
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

    writeFile() {
        if (!fs.existsSync(`${this.#dest}\\File_Names`)) fs.mkdirSync(`${this.#dest}\\File_Names`);
        if (this.animFileNames.length > 0) {
            const outputAnimFileNames = fs.createWriteStream(`${this.#dest}\\File_Names\\${extension}_anim_file_names.txt`, {
                flags: 'a'
            });
            for (const file of this.animFileNames) {
                if (file != "") outputAnimFileNames.write(file);
            }
            outputAnimFileNames.end();
            this.animFileNames = [];
        }

        if (this.vfxFileNames.length > 0) {
            const outputVfxFileNames = fs.createWriteStream(`${this.#dest}\\File_Names\\${extension}_fxspec_file_names.txt`, {
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

export {HYDParser};