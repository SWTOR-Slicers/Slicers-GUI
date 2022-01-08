import { Reader } from '../util/FileWrapper.js';

const fs = require('fs');
const {Buffer} = require('buffer');

class AMXParser {
    #dest;
    /**
     * AMX parser class
     * @param  {string} dest destination for ouputted hashes
     * @param  {string} ext extentions to search
     */
     constructor(dest, ext) {
        this.#dest = dest;
        this.extension = ext;
        this.fileNames = new Map();
        this.errors = [];
    }

    /**
     * parses an AMX file
     * @param  {Reader} reader
     * @param  {string} fullFileName
     */
    parseAMX(reader, fullFileName) {
        const header = reader.readUint32();

        if (header.toString(16) != "20584d41") {
            this.errors.push("File: " + fullFileName);
            this.errors.push("Invalid header" + header);
            return;
        } else {
            reader.readUint16(); //unknown
            let stop = false;
            while (!stop) {
                const fileLen = reader.readByte();
                if (fileLen == 0) {
                    stop = true;
                } else {
                    const fileNameBytes = reader.readBytes(fileLen);
                    const fileName = Buffer.from(fileNameBytes).toString('ascii');

                    const dirLen = reader.readByte();
                    const dirNameBytes = reader.readBytes(dirLen);
                    const dirName = Buffer.from(dirNameBytes).toString('ascii');

                    let fullName = "/resources/anim/" + dirName.replace(/\\/g, "/") + fileName;
                    fullName = fullName.replace("//", "/");

                    //humanoid\bfanew
                    //em_wookiee_10
                    this.fileNames.set(fullName + ".jba", fullName + ".jba");
                    this.fileNames.set(fullName + ".mph", fullName + ".mph");
                    this.fileNames.set(fullName + ".mph.amx", fullName + ".mph.amx");

                    reader.readUint32();
                    const check = reader.readByte();
                    if (check != 2 && check != 3) stop = true;
                }
            }
        }
    }

    genHash() {
        const namesArr = Array.from(this.fileNames.keys());
        const res = namesArr.map(file => file.replace("\\", "/"));
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
                outputNames.write(file);
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

export {AMXParser}