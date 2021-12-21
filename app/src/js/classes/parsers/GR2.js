import { Reader } from '../util/FileWrapper.js';

const fs = require('fs');

class GR2Parser {
    #dest;
    /**
     * GR2 parser class
     * @param  {string} dest destination for ouputted hashes
     * @param  {string} ext extentions to search
     */
    constructor(dest, ext) {
        this.#dest = dest;
        this.extension = ext;
        this.fileNames = [];
        this.meshNames = new Map();
        this.matNames = [];
        this.errors = [];
    }

    parseGR2(fileBuffer, fullFileName, tor) {
        const offsetMeshNames = [];
        const offsetMatNames = [];
        const reader = new Reader(fileBuffer.buffer);

        const type = reader.readUint32();

        if (type === 0 || type === 1) {
            reader.offset = 0x10;

            reader.readUInt32();
            reader.readUInt32();
            const numMeshes = reader.readUInt16();
            const numMaterials = reader.readUInt16();

            reader.offset = 0x50;
            reader.readUInt32();
            const offsetMeshHeader = reader.readUInt32();;
            const offsetMaterialNameOffsets = reader.readUInt32();;

            if (numMeshes != 0) {
                reader.offset = offsetMeshHeader;

                for (let i = 0; i < numMeshes; i++) {
                    let offset = reader.readUInt32();
                    reader.readUint8();
                    reader.readUInt16();
                    reader.readUInt16();
                    reader.readUInt16();
                    reader.readUInt16();
                    reader.readUInt32();
                    reader.readUInt32();
                    reader.readUInt32();
                    reader.readUInt32();
                    reader.readUInt32();
                    reader.readUInt32();
                    offsetMeshNames.push(offset);
                }

                if (offsetMeshNames.length > 0) {
                    for (const i of offsetMeshNames) {
                        reader.offset = i;
                        const meshName = reader.readString();
                        if (!this.meshNames.keys().includes(meshName)) meshNames.set(meshName, tor);
                        this.matNames.push(meshName);
                    }
                }
            }

            if (numMaterials != 0) {
                reader.offset = offsetMaterialNameOffsets;
                for (let i = 0; i < numMaterials; i++) {
                    const offset = reader.readUInt32();
                    offsetMatNames.push(offset);
                }

                if (offsetMaterialNames.length > 0) {
                    for (const i of offsetMatNames) {
                        reader.offset = i;
                        this.matNames.push(reader.readString());
                    }
                }
            }
        }
    }

    genHash() {
        const res = [...this.meshNames.entries().map(file => {
            let output = "";
            if (file[1].fileName.includes("_dynamic_")) {
                if (file[0].includes("_")) {
                    const type = file[0].split('_')[0];
                    output += "/resources/art/dynamic/" + type + "/model/" + file[0] + ".gr2\r\n";
                    output += "/resources/art/dynamic/" + type + "/model/" + file[0] + ".lod.gr2\r\n";
                    output += "/resources/art/dynamic/" + type + "/model/" + file[0] + ".clo\r\n";
                }
            } else {
                output += file[0] + ".gr2\r\n";
            }
            output = output.replace("//", "/");
            return output;
        }),
        ...this.matNames.map(file => `/resources/art/shaders/materials/${file}.mat`)];
        return res;
    }

    writeFile() {
        if (!fs.existsSync(`${this.#dest}\\File_Names`)) fs.mkdirSync(`${this.#dest}\\File_Names`);
        if (this.meshNames.length > 0) {
            const outputNames = fs.createWriteStream(`${this.#dest}\\File_Names\\${this.extension}_mesh_file_names.txt`, {
                flags: 'a'
            });
            for (const file of this.meshNames.entries()) {
                let output = "";
                if (file[1].fileName.includes("_dynamic_")) {
                    if (file[0].includes("_")) {
                        const type = file[0].split('_')[0];
                        output += "/resources/art/dynamic/" + type + "/model/" + file[0] + ".gr2\r\n";
                        output += "/resources/art/dynamic/" + type + "/model/" + file[0] + ".lod.gr2\r\n";
                        output += "/resources/art/dynamic/" + type + "/model/" + file[0] + ".clo\r\n";
                    }
                } else {
                    output += file[0] + ".gr2\r\n";
                }
                output = output.replace("//", "/");
                outputNames.write(output);
            }
            outputNames.end();
        }

        if (this.matNames.length > 0) {
            const outputNames = fs.createWriteStream(`${this.#dest}\\File_Names\\${this.extension}_material_file_names.txt`, {
                flags: 'a'
            });
            for (const file of this.matNames) {
                outputNames.write(`/resources/art/shaders/materials/${file}.mat\r\n`);
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

export {GR2Parser}