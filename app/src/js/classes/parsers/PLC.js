import { NodeEntr } from "../formats/Node.js";

const fs = require('fs');

class PLCParser {
    #dest;
    /**
     * PLC nodes parser class
     * @param  {string} dest destination for ouputted hashes
     * @param  {string} ext extentions to search
     */
     constructor(dest, ext) {
        this.#dest = dest;
        this.extension = ext;
        this.fileNames = [];
        this.errors = [];
    }

    /**
     * parses the PLC nodes
     * @param  {Array<NodeEntr>} plcNodes
     */
    parsePLC(plcNodes) {
        for (const obj of plcNodes) {
            obj.readNode();
            const plcModel = obj.obj.value["plcModel"];
            if (plcModel != null) {
                if (plcModel.contains("dyn.")) continue;
                this.fileNames.push(plcModel.replace("\\", "/").replace("//", "/"));
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
                if (item != "") outputNames.write(("/resources/" + file).replace("//", "/"));
            }
            outputNames.end();
            this.fileNames = [];
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

export {PLCParser};