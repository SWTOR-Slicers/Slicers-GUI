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
        this.fileNames = [];
        this.errors = [];
    }

    parseBNK(reader) {
        const bnk = new BNK(reader);

        if (bnk.sections.HIRC) {
            if (bnk.hirc.numObject != 0) {
                for (const obj of bnk.hirc.objects) {
                    if (obj.type == 2) {
                        if (obj.isStreamed != 0) {
                            if (obj.audioId != 0) this.fileNames.push("/resources/bnk2/streamed/" + obj.audio_id + ".wem");
                            if (obj.audioSourceId != 0) this.fileNames.push("/resources/bnk2/streamed/" + obj.audio_source_id + ".wem");
                        }
                    } else if (obj.type == 11) {
                        if (obj.audioId != 0) this.fileNames.push("/resources/bnk2/streamed/" + obj.audio_id + ".wem");
                        if (obj.audioSourceId != 0) this.fileNames.push("/resources/bnk2/streamed/" + obj.audio_source_id + ".wem");
                    }
                }
            }
        }

        if (bnk.sections.STID) {
            if (bnk.stid.numSndBnk != 0) {
                for (const obj of bnk.stid.soundbanks) {
                    this.fileNames.Add("/resources/bnk2/" + obj.name + ".bnk");
                    this.fileNames.Add("/resources/en-us/bnk2/" + obj.name + ".bnk");
                }
            }
        }
    }

    genHash() {
        const res = this.fileNames.map(file => file.replace("\\", "/"));
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