import { XDocument } from '../util/XDocument';

const fs = require('fs');

class FXSPECParser {
    #dest;
    /**
     * FXSPEC parser class
     * @param  {string} dest destination for ouputted hashes
     * @param  {string} ext extentions to search
     */
     constructor(dest, ext) {
        this.#dest = dest;
        this.extension = ext;
        this.fileNames = [];
        this.resourceFileNames = [];
        this.errors = [];
    }

    /**
     * parses an FXSPEC file
     * @param  {XDocument} doc
     * @param  {string} fullFileName
     */
    parseFXSPEC(doc, fullFileName) {
        let _ = fullFileName.substring(fullFileName.lastIndexOf('\\') + 1);
        _ = fullFileName.substring(0, fullFileName.lastIndexOf('/'));

        try {
            const docAsNodes = doc.nodes;
            const nsResolver = document.createNSResolver( docAsNodes.ownerDocument == null ? docAsNodes.documentElement : docAsNodes.ownerDocument.documentElement );
            const fileElemList = document.evaluate("//node()[@name='displayName']", docAsNodes, nsResolver, 7, null);
            for (const node of fileElemList) {
                const resource = node.innerText;
                this.fileNames.push(resource + ".fxspec");
            }

            const resourceElemList = document.evaluate("//node()[@name='_fxResourceName']", docAsNodes, nsResolver, 7, null);
            for (const node of resourceElemList) {
                const resource = node.innerText;
                if (resource.includes(".prt")) {
                    const output = "/resources/art/fx/particles/" + resource.replace('\\', '/').toLower();
                    output = output.replace("//", "/");
                    output = output.replace("/resources/art/fx/particles/art/fx/particles/", "/resources/art/fx/particles/");
                    resourceFileNames.push(output);
                } else if (resource.includes(".gr2")) {
                    const output = "/resources/" + resource.replace('\\', '/').toLower();
                    output = output.replace("//", "/");
                    resourceFileNames.push(output);
                } else if (resource.includes(".lit") || resource.includes(".ext") || resource.includes(".zzp")) {
                    const output = "/resources/" + resource.replace('\\', '/').toLower();
                    output = output.replace("//", "/");
                    resourceFileNames.push(output);

                } else if (resource.includes("Play_") || resource.includes("play_") || resource.includes("Stop_") || resource.includes("stop_") || resource == "" || resource.includes(".sgt") || resource.includes(".wav")) {
                    continue;
                }
            }

            const projTexElemList = document.evaluate("//node()[@name='_fxProjectionTexture']", docAsNodes, nsResolver, 7, null);
            for (const node of projTexElemList) {
                const resource = node.innerText.replace(".tiny.dds", "").replace(".dds", "").replace(".tex", "");
                const output = "/resources" + resource.replace('\\', '/').toLower();
                resourceFileNames.push(output + ".dds");
                resourceFileNames.push(output + ".tiny.dds");
                resourceFileNames.push(output + ".tex");
            }

            const projTex1ElemList = document.evaluate("//node()[@name='_fxProjectionTexture_layer1']", docAsNodes, nsResolver, 7, null);
            for (const node in projTex1ElemList) {
                const resource = node.innerText.replace(".tiny.dds", "").replace(".dds", "").replace(".tex", "");
                const output = "/resources" + resource.replace('\\', '/').toLower();
                resourceFileNames.push(output + ".dds");
                resourceFileNames.push(output + ".tiny.dds");
                resourceFileNames.push(output + ".tex");
            }

            const texNameElemList = document.evaluate("//node()[@name='_fxTextureName']", docAsNodes, nsResolver, 7, null);
            for (const node of texNameElemList) {
                const resource = node.innerText.replace(".tiny.dds", "").replace(".dds", "").replace(".tex", "");
                const output = "/resources" + resource.replace('\\', '/').toLower();
                resourceFileNames.push(output + ".dds");
                resourceFileNames.push(output + ".tiny.dds");
                resourceFileNames.push(output + ".tex");
            }
        } catch (e) {
            this.errors.push("File: " + fullFileName);
            this.errors.push(e.message + ":");
            this.errors.push(e.stack);
            this.errors.push("");
        }
    }

    writeFile() {
        if (!fs.existsSync(`${this.#dest}\\File_Names`)) fs.mkdirSync(`${this.#dest}\\File_Names`);
        if (this.fileNames.length > 0) {
            const outputNames = fs.createWriteStream(`${this.#dest}\\File_Names\\${extension}_file_names.txt`, {
                flags: 'a'
            });
            for (const file of this.fileNames) {
                outputNames.write(`${file.replace("\\", "/")}\r\n`);
            }
            outputNames.end();
            this.fileNames = [];
        }

        if (this.resourceFileNames.length > 0) {
            const outputResourceNames = fs.createWriteStream(`${this.#dest}\\File_Names\\${extension}_resource_file_names.txt`, {
                flags: 'a'
            });
            for (const file of this.resourceFileNames) {
                outputResourceNames.write(`${file.replace("\\", "/")}\r\n`);
            }
            outputResourceNames.end();
            this.resourceFileNames = [];
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

export {FXSPECParser};