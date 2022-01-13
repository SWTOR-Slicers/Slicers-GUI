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
            const plcModel = obj.fields.value["plcModel"];
            if (plcModel != null) {
                if (plcModel.contains("dyn.")) continue;
                this.fileNames.push(plcModel.replace("\\", "/").replace("//", "/"));
            }  
        }
    }

    genHash() {
        const res = [...this.fileNames.map(file => {
            if (file != "") {
                return ("/resources/" + file).replace("//", "/");
            }
        })];
        return res;
    }

    writeFile() {
        if (!fs.existsSync(`${this.#dest}\\File_Names`)) fs.mkdirSync(`${this.#dest}\\File_Names`);
        if (this.fileNames.length > 0) {
            const outputNames = fs.createWriteStream(`${this.#dest}\\File_Names\\${this.extension}_file_names.txt`, {
                flags: 'a'
            });
            for (const file of this.fileNames) {
                if (item != "") outputNames.write(("/resources/" + file).replace("//", "/"));
            }
            outputNames.end();
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

export {PLCParser};