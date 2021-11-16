import { XDocument } from '../util/XDocument';

const fs = require('fs');

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

    parsePRT(fileStream, _) {
        const reader = new StreamReader(fileStream);
        let line;
        while ((line = reader.ReadLine()) != null) {
            let test = line.replace("  .", "");
            test = test.replace("Name=", "");
            test = test.replace("EmitSpec=", "");
            test = test.replace("Trail", "");
            test = test.replace("Texture_Purple", "");
            test = test.replace("Texture_Blue", "");
            test = test.replace("Texture_Red", "");
            test = test.replace("Texture_Green", "");
            test = test.replace("Texture_White", "");
            test = test.replace("Texture_Yellow", "");
            test = test.replace("Texture_Orange", "");
            test = test.replace("Texture", "/");
            test = test.replace("GrannyFile", "");
            test = test.replace("EmitFXSpec=", "");
            test = test.replace("EmitAtDeathSpec=", "");
            test = test.replace("=", "");
            test = test.replace("\\", "/");
            test = test.replace("//", "/");
            test = test.toLowerCase();

            if (test.contains(".prt")) {
                if (!test.contains("/art/fx/particles/"))
                    fileNames.push("/resources/art/fx/particles/" + test);
                else
                    fileNames.push("/resources" + test);
            } else if (test.contains(".dds")) {
                fileNames.push("/resources" + test);
                fileNames.push("/resources" + test.replace(".dds", ".tiny.dds"));
                fileNames.push("/resources" + test.replace(".dds", ".tex"));
            } else if (test.contains(".fxspec")) {
                fileNames.push("/resources" + test);
            } else if (test.contains(".gr2")) {
                fileNames.push("/resources" + test);
            }
        }
    }

    writeFile() {
        if (!fs.existsSync(`${this.#dest}\\File_Names`)) fs.mkdirSync(`${this.#dest}\\File_Names`);
        if (fileNames.length > 0) {
            const outputNames = fs.createWriteStream(`${this.#dest}\\File_Names\\${extension}_file_names.txt.txt`, {
                flags: 'a'
            });
            for (const file of fileNames) {
                outputNames.write(`${file.replace("\\", "/")}\r\n`);
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

export {PRTParser}