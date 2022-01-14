const fs = require('fs');
const stream = require('stream');
const readLine = require('readline');

class PRTParser {
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

    async parsePRT(data, _) {
        const reader = new stream.PassThrough();
        reader.end(data);

        const rl = readLine.createInterface({
            input: reader,
            crlfDelay: Infinity
        });

        for await (const line of rl) {
            let test = line.replaceAll("  .", "");
            test = test.replaceAll("Name=", "");
            test = test.replaceAll("EmitSpec=", "");
            test = test.replaceAll("Trail", "");
            test = test.replaceAll("Texture_Purple", "");
            test = test.replaceAll("Texture_Blue", "");
            test = test.replaceAll("Texture_Red", "");
            test = test.replaceAll("Texture_Green", "");
            test = test.replaceAll("Texture_White", "");
            test = test.replaceAll("Texture_Yellow", "");
            test = test.replaceAll("Texture_Orange", "");
            test = test.replaceAll("Texture", "/");
            test = test.replaceAll("GrannyFile", "");
            test = test.replaceAll("EmitFXSpec=", "");
            test = test.replaceAll("EmitAtDeathSpec=", "");
            test = test.replaceAll("=", "");
            test = test.replaceAll("\\", "/");
            test = test.replaceAll("//", "/");
            test = test.toLowerCase();

            if (test.includes(".prt")) {
                if (!test.includes("/art/fx/particles/")) {
                    this.fileNames.push("/resources/art/fx/particles/" + test);
                } else {
                    this.fileNames.push("/resources" + test);
                }
            } else if (test.includes(".dds")) {
                this.fileNames.push("/resources" + test);
                this.fileNames.push("/resources" + test.replaceAll(".dds", ".tiny.dds"));
                this.fileNames.push("/resources" + test.replaceAll(".dds", ".tex"));
            } else if (test.includes(".fxspec")) {
                this.fileNames.push("/resources" + test);
            } else if (test.includes(".gr2")) {
                this.fileNames.push("/resources" + test);
            }
        }
    }

    genHash() {
        const res = [...this.fileNames.map(file => file.replaceAll("\\", "/"))];
        return res;
    }

    writeFile() {
        if (!fs.existsSync(`${this.#dest}\\File_Names`)) fs.mkdirSync(`${this.#dest}\\File_Names`);
        if (this.fileNames.length > 0) {
            const outputNames = fs.createWriteStream(`${this.#dest}\\File_Names\\${this.extension}_file_names.txt`, {
                flags: 'a'
            });
            for (const file of this.fileNames) {
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

export {PRTParser}