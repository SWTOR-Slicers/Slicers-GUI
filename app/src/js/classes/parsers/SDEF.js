import { Reader } from '../util/FileWrapper.js';

const fs = require('fs');

class SDEFParser {
    #dest;
    /**
     * SDEF (Script Definition) parser class
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
     * parses the scriptdef.list file
     * @param  {Reader} reader
     */
    parseSDEF(reader) {
        const header = reader.readUint32(false);

        if (header.toString(16) != "53444546") {
            return;
        } else {
            //read unknown 1 version info??
            reader.readBytes(4);

            //C9 indicates 2 byte integer
            reader.readByte();

            //Read 2 byte integer                
            const count = reader.readUInt16(false);

            for (let c = 0; c < count; c++) {
                //CF Idenitifes 8 byte integer
                reader.readByte();

                //Read the 8 byte integer                    
                const id = reader.readUInt64(false);

                //null seperator
                reader.readByte();

                //CB identifies a 4 byte integer -- CA identifies a 3 byte integer                    
                const cb = reader.readByte();

                if (cb == 203) {
                    //Read the 4 byte integer
                    reader.readBytes(4);
                } else if (cb == 202) {
                    //Read the 3 byte integer
                    reader.readBytes(3);
                }

                //null seperator
                reader.readByte();

                this.fileNames.push("/resources/systemgenerated/compilednative/" + id);
            }
        }
        return;
    }

    genHash() {
        const res = [...this.fileNames.map(file => file.replace("\\", "/"))];
        return res;
    }

    writeFile() {
        if (!fs.existsSync(`${this.#dest}\\File_Names`)) fs.mkdirSync(`${this.#dest}\\File_Names`);
        if (this.fileNames.length > 0) {
            const outputNames = fs.createWriteStream(`${this.#dest}\\File_Names\\${this.extension}_file_names.txt`, {
                flags: 'a'
            });
            for (const file of this.fileNames) {
                outputNames.write(`${file.replace("\\", "/")}`);
            }
            outputNames.end();
        }

        if (this.errors.length > 0) {
            const outputErrors = fs.createWriteStream(`${this.#dest}\\File_Names\\${this.extension}_error_list.txt`, {
                flags: 'a'
            });
            for (const error of errors) {
                outputErrors.write(error);
            }
            outputErrors.end();
        }
    }
}

export {SDEFParser};