import { BNK } from '../formats/BNK.js';

const fs = require('fs');

class BNKParser {
    #dest;
    /**
     * bnk parser class
     * @param  {string} dest destination for ouputted hashes
     * @param  {string} ext extentions to search
     */
    constructor(dest, ext) {
        this.#dest = dest;
        this.extension = ext;
        this.fileNames = new Map();
        this.errors = [];
    }

    parseBNK(reader) {
        const bnk = new BNK(reader);

        if (bnk.sections.HIRC) {
            if (bnk.sections.HIRC.objects.length != 0) {
                for (const obj of Object.values(bnk.sections.HIRC.objects)) {
                    if (obj.type == 2) {
                        if (obj.isStreamed != 0) {
                            if (obj.audioId != 0) this.fileNames.set("/resources/bnk2/streamed/" + obj.audioId + ".wem", "/resources/bnk2/streamed/" + obj.audioId + ".wem");
                            if (obj.audioSourceId != 0) this.fileNames.set("/resources/bnk2/streamed/" + obj.audioSourceId + ".wem", "/resources/bnk2/streamed/" + obj.audioSourceId + ".wem");
                        }
                    } else if (obj.type == 11) {
                        if (obj.audioId != 0) this.fileNames.set("/resources/bnk2/streamed/" + obj.audioId + ".wem", "/resources/bnk2/streamed/" + obj.audioId + ".wem");
                        if (obj.audioSourceId != 0) this.fileNames.set("/resources/bnk2/streamed/" + obj.audioSourceId + ".wem", "/resources/bnk2/streamed/" + obj.audioSourceId + ".wem");
                    }
                }
            }
        }

        if (bnk.sections.STID) {
            if (bnk.sections.STID.numSndBnk != 0) {
                for (const obj of Object.values(bnk.sections.STID.soundbanks)) {
                    this.fileNames.set("/resources/bnk2/" + obj.name + ".bnk", "/resources/bnk2/" + obj.name + ".bnk");
                    this.fileNames.set("/resources/en-us/bnk2/" + obj.name + ".bnk", "/resources/en-us/bnk2/" + obj.name + ".bnk");
                }
            }
        }
    }

    genHash() {
        const namesArr = Array.from(this.fileNames.keys());
        const res = namesArr.map(file => file.replaceAll("\\", "/"));
        return res;
    }

    writeFile() {
        if (!fs.existsSync(`${this.#dest}\\File_Names`)) fs.mkdirSync(`${this.#dest}\\File_Names`);
        const namesArr = Array.from(this.fileNames.keys());
        if (namesArr.length > 0) {
            const outputNames = fs.createWriteStream(`${this.#dest}\\File_Names\\${this.extension}_file_names.txt`, {
                flags: 'a'
            });
            for (const file of namesArr) {
                outputNames.write(`${file.replaceAll("\\", "/")}\r\n`);
            }
            outputNames.end();
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
}

export {BNKParser}