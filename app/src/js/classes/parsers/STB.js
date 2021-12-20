import { XDocument } from '../util/XDocument';

const fs = require('fs');

class STBParser {
    #dest;
    /**
     * stb parser class
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
     * parses an STB manifest XML file
     * @param  {XDocument} doc
     */
    parseSTBManifest(doc) {
        const fileList = doc.elements("file");
        if (fileList.length > 0) {
            for (const node of fileList) {
                const attr = node.attribute("val");
                if (attr != null) {
                    this.fileNames.push(attr);
                }
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
                if (file != "") outputNames.write(`/resources/en-us/${file.replace(".", "/")}.stb`.replace("//", "/"));
            }
            outputNames.end();
            this.fileNames = [];
        }

        if (this.errors.length > 0) {
            const outputErrors = fs.createWriteStream(`${this.#dest}\\File_Names\\${extension}_error_list.txt`, {
                flags: 'a'
            });
            for (const error of this.errors) {
                outputErrors.write(`${error}\r\n`);
            }
            outputErrors.end();
            this.errors = [];
        }
    }
}

export { STBParser }