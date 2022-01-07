// import { readString } from '../../Util.js';
// import { FileWrapper, Reader } from '../util/FileWrapper.js';

// const path = require('path');
// const zlib = require('zlib');

// class ArchiveEntryTable {
//     constructor(capacity, offset) {
//         this.capacity = capacity;
//         this.offset = offset;
//     }

//     static fromJSON(json) {
//         return new ArchiveEntryTable(json.capacity, json.offset);
//     }
// }

// class FileExtension {
//     file_types = new Map();
//     xml_types = new Map();        

//     constructor() {
//         this.file_types.set("CWS", "swf");
//         this.file_types.set("CFX", "gfx");
//         this.file_types.set("PROT", "node");
//         this.file_types.set("GAWB", "gr2");
//         this.file_types.set("SCPT", "scpt");
//         this.file_types.set("FACE", "fxe");
//         this.file_types.set("PK", "zip");
//         this.file_types.set("lua", "lua");
//         this.file_types.set("DDS", "dds");
//         this.file_types.set("XSM", "xsm");
//         this.file_types.set("XAC", "xac");
//         this.file_types.set("8BPS", "8bps");
//         this.file_types.set("bdLF", "db");
//         this.file_types.set("gsLF", "geom");
//         this.file_types.set("idLF", "diffuse");
//         this.file_types.set("psLF", "specular");
//         this.file_types.set("amLF", "mask");
//         this.file_types.set("ntLF", "tint");
//         this.file_types.set("lgLF", "glow");
//         this.file_types.set("Gamebry", "nif");
//         this.file_types.set("WMPHOTO", "lmp");
//         this.file_types.set("BKHD", "bnk");
//         this.file_types.set("AMX", "amx");
//         this.file_types.set("OLCB", "clo");
//         this.file_types.set("PNG", "png");
//         this.file_types.set("; Zo", "zone.txt");
//         this.file_types.set("RIFF", "riff");
//         this.file_types.set("WAVE", "wav");
//         this.file_types.set("\0\0\0\0", "zero.txt");

//         this.xml_types.set("<Material>", "mat");
//         this.xml_types.set("<TextureObject", "tex");
//         this.xml_types.set("<manifest>", "manifest");
//         this.xml_types.set("<\0n\0o\0d\0e\0W\0C\0l\0a\0s\0s\0e\0s\0", "fxspec");
//         this.xml_types.set("<\0A\0p\0p\0e\0a\0r\0a\0n\0c\0e", "epp");
//         this.xml_types.set("<ClothData>", "clo");
//         this.xml_types.set("<v>", "not");
//         this.xml_types.set("<Rules>", "rul");
//         this.xml_types.set("<SurveyInstance>", "svy");
//         this.xml_types.set("<DataTable>", "tbl");
//         this.xml_types.set("<TextureObject xmlns", "tex");
//         this.xml_types.set("<EnvironmentMaterial", "emt");
//     }

//     /**
//      * Tries to determine the file type of a file.
//      * @param  {ArchiveEntry} file The file.
//      * @returns {string} The determined file type.
//      */
//     guessExtension(file) {
//         let fs = file.getReadStream();
//         let bytes = fs.readBytes((file.crc < 200) ? file.comprSize : 200);

//         if (((bytes[0] == 0x01) && (bytes[1] == 0x00)) && (bytes[2] == 0x00)) return "stb";
//         if (((bytes[0] == 0x02) && (bytes[1] == 0x00)) && (bytes[2] == 0x00)) return "mph";
//         if (((bytes[0] == 0x21) && (bytes[1] == 0x0d)) && ((bytes[2] == 0x0a) && (bytes[3] == 0x21))) {
//             const str5 = readString(bytes.buffer, 0, 64);
//             if (str5.includes("Particle Specification")) {
//                 return "prt";
//             } else {
//                 return "dat";
//             }
//         }
//         if (((bytes[0] == 0) && (bytes[1] == 1)) && (bytes[2] == 0)) return "ttf";
//         if (((bytes[0] == 10) && (bytes[1] == 5)) && ((bytes[2] == 1) && (bytes[3] == 8))) return "pcx";
//         if (((bytes[0] == 0x38) && (bytes[1] == 0x03)) && ((bytes[2] == 0x00) && (bytes[3] == 0x00))) return "spt";
//         if (((bytes[0] == 0x18) && (bytes[1] == 0x00)) && ((bytes[2] == 0x00) && (bytes[3] == 0x00))) {
//             const strCheckDAT = decoder.decode(bytes, 4, 22);
//             if(strCheckDAT == "AREA_DAT_BINARY_FORMAT" || strCheckDAT == "ROOM_DAT_BINARY_FORMAT") return "dat";
//         }

//         const str = readString(bytes.buffer, 0, bytes.length);
//         const str2 = readString(bytes.buffer, 0, 4);
//         for (const item of this.file_types) {
//             if (str2.includes(item[0])) {
//                 if (item[0] == "RIFF") {
//                     if (readString(bytes.buffer, 8, 4).includes("WAVE")) return "wav";
//                 } else if (item[0] == "lua") {
//                     if (str.indexOf("lua") > 50) continue;
//                 } else if (item[0] == "\0\0\0\0") {
//                     if (bytes[0x0b] == 0x41) return "jba";
//                 }
//                 return item[1];
//             }
//         }

//         if (str2.includes("<")) {
//             const str4 = readString(bytes.buffer, 0, 64);
//             for (const item of this.xml_types) {
//                 if (str4.includes(item[0])) return item[1];
//             }
//             return "xml";
//         }

//         let str6;
//         if(bytes.length < 128) {
//             str6 = readString(bytes.buffer, 0, bytes.length);
//         } else {
//             str6 = readString(bytes.buffer, 0, 128);
//         }
//         if (str6.includes("[SETTINGS]") && str6.includes("gr2")) return "dyc";

//         if (str.indexOf("cnv_") >= 1 && str.indexOf(".wem") >= 1) return "acb";

//         let length = str.split(",", 10).length;
//         if (length >= 10) {
//             return "csv";
//         } else {
//             return "txt";
//         }
//     }
// }

// class ArchiveEntry {
//     constructor(offset, metaDataSize, comprSize, uncomprSize, crc, isCompr, ph, sh, fileId, fileTableNum, fileTableFileIdx, torPath) {
//         this.offset = offset;

//         this.metaDataSize = metaDataSize;
//         this.crc = crc;

//         this.comprSize = comprSize;
//         this.uncomprSize = uncomprSize;
//         this.isCompr = isCompr;

//         this.fileId = fileId;
//         this.ph = ph;
//         this.sh = sh;

//         this.fileTableNum = fileTableNum;
//         this.fileTableFileIdx = fileTableFileIdx;

//         this.torPath = torPath;
//         this.tor = path.basename(this.torPath);

//         this.isNamed = null;
//         this.hash = null;
//     }

//     getReadStream() {
//         const wrapper = new FileWrapper(this.torPath);

//         wrapper.seek(this.offset+BigInt(this.metaDataSize), 0);
//         const data = wrapper.read(this.isCompr ? this.comprSize : this.uncomprSize).data;

//         let decompr;
//         if (this.isCompr) {
//             decompr = zlib.inflateSync(data, {
//                 level: zlib.constants.Z_BEST_COMPRESSION,
//                 maxOutputLength: this.uncomprSize
//             });
//         } else {
//             decompr = data;
//         }

//         return new Reader(decompr);
//     }

//     static fromJSON(json) {
//         return new ArchiveEntry(json.offset, json.metaDataSize, json.comprSize, json.uncomprSize, json.crc, json.isCompr, json.ph, json.sh, json.fileId, json.fileTableNum, json.fileTableFileIdx, json.torPath);
//     }
// }

// class Archive {
//     constructor(file, idx, loadTables = false) {
//         this.file = file;
//         this.idx = idx;
//         this.tables = [];
//         this.entries = {};

//         this.data = new FileWrapper(this.file);

//         if (loadTables) {
//             this.#readFileTables();
//         }
//     }

//     async #readFileTables() {
//         this.entries = {};
//         const reader = this.data.read(this.data.length);

//         const magic = reader.readUint32();
//         if (magic !== 0x50594D) throw new Error(`This is not an MYP file: index ${this.idx}.`);
        
//         reader.seek(12, 0);

//         let tableOffset = reader.readUint64();

//         this.tableCapacity = reader.readUint32();
//         this.totalFiles = reader.readUint32();

//         while (tableOffset != 0n) {
//             reader.seek(tableOffset, 0);

//             const numFiles = reader.readUint32();
//             tableOffset = reader.readUint64();

//             const table = new ArchiveEntryTable(numFiles, tableOffset);
//             const tableIdx = this.tables.length;
//             this.tables.push(table);

//             for (let i = 0; i < numFiles; i++) {
//                 let offset = reader.readUint64();
//                 if (offset === 0) {
//                     fileTable.seek(26, 1);
//                     continue;
//                 }

//                 const headerSize = reader.readUint32();

//                 const comprSize = reader.readUint32();
//                 const uncomprSize = reader.readUint32();

//                 const reOff = reader.offset;

//                 const sh = reader.readUint32();
//                 const ph = reader.readUint32();

//                 reader.seek(reOff, 0);

//                 const fileId = reader.readUint64();
//                 const crc = reader.readUint32();

//                 const compression = reader.readUint16();
//                 const fileObj = new ArchiveEntry(
//                     offset,
//                     headerSize,
//                     (compression !== 0) ? comprSize : 0,
//                     uncomprSize,
//                     crc,
//                     compression !== 0,
//                     ph,
//                     sh,
//                     fileId,
//                     tableIdx,
//                     i,
//                     this.file
//                 );

//                 const hash = fileObj.sh + '|' + fileObj.ph;
//                 this.entries[hash] = fileObj;
//             }
//         }
//     }
// }

// export {Archive, ArchiveEntry, FileExtension};
import { readString } from '../../Util.js';
import { FileWrapper, Reader } from '../util/FileWrapper.js';

const path = require('path');
const zlib = require('zlib');

class ArchiveEntryTable {
    constructor(capacity, offset) {
        this.capacity = capacity;
        this.offset = offset;
    }

    static fromJSON(json) {
        return new ArchiveEntryTable(json.capacity, json.offset);
    }
}

class FileExtension {
    file_types = new Map();
    xml_types = new Map();        

    constructor() {
        this.file_types.set("CWS", "swf");
        this.file_types.set("CFX", "gfx");
        this.file_types.set("PROT", "node");
        this.file_types.set("GAWB", "gr2");
        this.file_types.set("SCPT", "scpt");
        this.file_types.set("FACE", "fxe");
        this.file_types.set("PK", "zip");
        this.file_types.set("lua", "lua");
        this.file_types.set("DDS", "dds");
        this.file_types.set("XSM", "xsm");
        this.file_types.set("XAC", "xac");
        this.file_types.set("8BPS", "8bps");
        this.file_types.set("bdLF", "db");
        this.file_types.set("gsLF", "geom");
        this.file_types.set("idLF", "diffuse");
        this.file_types.set("psLF", "specular");
        this.file_types.set("amLF", "mask");
        this.file_types.set("ntLF", "tint");
        this.file_types.set("lgLF", "glow");
        this.file_types.set("Gamebry", "nif");
        this.file_types.set("WMPHOTO", "lmp");
        this.file_types.set("BKHD", "bnk");
        this.file_types.set("AMX", "amx");
        this.file_types.set("OLCB", "clo");
        this.file_types.set("PNG", "png");
        this.file_types.set("; Zo", "zone.txt");
        this.file_types.set("RIFF", "riff");
        this.file_types.set("WAVE", "wav");
        this.file_types.set("\0\0\0\0", "zero.txt");

        this.xml_types.set("<Material>", "mat");
        this.xml_types.set("<TextureObject", "tex");
        this.xml_types.set("<manifest>", "manifest");
        this.xml_types.set("<\0n\0o\0d\0e\0W\0C\0l\0a\0s\0s\0e\0s\0", "fxspec");
        this.xml_types.set("<\0A\0p\0p\0e\0a\0r\0a\0n\0c\0e", "epp");
        this.xml_types.set("<ClothData>", "clo");
        this.xml_types.set("<v>", "not");
        this.xml_types.set("<Rules>", "rul");
        this.xml_types.set("<SurveyInstance>", "svy");
        this.xml_types.set("<DataTable>", "tbl");
        this.xml_types.set("<TextureObject xmlns", "tex");
        this.xml_types.set("<EnvironmentMaterial", "emt");
    }

    /**
     * Tries to determine the file type of a file.
     * @param  {ArchiveEntry} file The file.
     * @returns {string} The determined file type.
     */
    guessExtension(file) {
        let fs = file.getReadStream();
        if (fs.view.byteLength == 0) {
            return "empty";
        }
        let bytes = fs.readBytes((fs.view.byteLength < 200) ? file.comprSize : 200);

        if (((bytes[0] == 0x01) && (bytes[1] == 0x00)) && (bytes[2] == 0x00)) return "stb";
        if (((bytes[0] == 0x02) && (bytes[1] == 0x00)) && (bytes[2] == 0x00)) return "mph";
        if (((bytes[0] == 0x21) && (bytes[1] == 0x0d)) && ((bytes[2] == 0x0a) && (bytes[3] == 0x21))) {
            const str5 = readString(bytes.buffer, 0, 64);
            if (str5.includes("Particle Specification")) {
                return "prt";
            } else {
                return "dat";
            }
        }
        if (((bytes[0] == 0) && (bytes[1] == 1)) && (bytes[2] == 0)) return "ttf";
        if (((bytes[0] == 10) && (bytes[1] == 5)) && ((bytes[2] == 1) && (bytes[3] == 8))) return "pcx";
        if (((bytes[0] == 0x38) && (bytes[1] == 0x03)) && ((bytes[2] == 0x00) && (bytes[3] == 0x00))) return "spt";
        if (((bytes[0] == 0x18) && (bytes[1] == 0x00)) && ((bytes[2] == 0x00) && (bytes[3] == 0x00))) {
            const strCheckDAT = readString(bytes.buffer, 4, 22);
            if(strCheckDAT == "AREA_DAT_BINARY_FORMAT" || strCheckDAT == "ROOM_DAT_BINARY_FORMAT") return "dat";
        }

        const str = readString(bytes.buffer, 0, bytes.length);
        const str2 = readString(bytes.buffer, 0, 4);
        for (const item of this.file_types) {
            if (str2.includes(item[0])) {
                if (item[0] == "RIFF") {
                    if (readString(bytes.buffer, 8, 4).includes("WAVE")) return "wav";
                } else if (item[0] == "lua") {
                    if (str.indexOf("lua") > 50) continue;
                } else if (item[0] == "\0\0\0\0") {
                    if (bytes[0x0b] == 0x41) return "jba";
                }
                return item[1];
            }
        }

        if (str2.includes("<")) {
            const str4 = readString(bytes.buffer, 0, 64);
            for (const item of this.xml_types) {
                if (str4.includes(item[0])) return item[1];
            }
            return "xml";
        }

        let str6;
        if(bytes.length < 128) {
            str6 = readString(bytes.buffer, 0, bytes.length);
        } else {
            str6 = readString(bytes.buffer, 0, 128);
        }
        if (str6.includes("[SETTINGS]") && str6.includes("gr2")) return "dyc";

        if (str.indexOf("cnv_") >= 1 && str.indexOf(".wem") >= 1) return "acb";

        let length = str.split(",", 10).length;
        if (length >= 10) {
            return "csv";
        } else {
            return "txt";
        }
    }
}

class ArchiveEntry {
    constructor(offset, metaDataSize, comprSize, uncomprSize, crc, isCompr, ph, sh, fileId, fileTableNum, fileTableFileIdx, torPath) {
        this.offset = offset;

        this.metaDataSize = metaDataSize;
        this.crc = crc;

        this.comprSize = comprSize;
        this.uncomprSize = uncomprSize;
        this.isCompr = isCompr;

        this.fileId = fileId;
        this.ph = ph;
        this.sh = sh;

        this.fileTableNum = fileTableNum;
        this.fileTableFileIdx = fileTableFileIdx;

        this.torPath = torPath;
        this.tor = path.basename(this.torPath);

        this.isNamed = null;
        this.hash = null;
    }

    getReadStream() {
        const wrapper = new FileWrapper(this.torPath);

        wrapper.seek(this.offset+BigInt(this.metaDataSize), 0);
        const data = wrapper.read(this.isCompr ? this.comprSize : this.uncomprSize).data;

        let decompr;
        if (this.isCompr) {
            decompr = zlib.inflateSync(data, {
                level: zlib.constants.Z_BEST_COMPRESSION,
                maxOutputLength: this.uncomprSize
            });
        } else {
            decompr = data;
        }

        return new Reader(decompr);
    }

    static fromJSON(json) {
        return new ArchiveEntry(json.offset, json.metaDataSize, json.comprSize, json.uncomprSize, json.crc, json.isCompr, json.ph, json.sh, json.fileId, json.fileTableNum, json.fileTableFileIdx, json.torPath);
    }
}

class Archive {
    constructor(file, idx, loadTables = false) {
        this.file = file;
        this.idx = idx;
        this.tables = [];
        this.entries = {};

        this.data = new FileWrapper(this.file);

        if (loadTables) {
            this.#readFileTables();
        }
    }

    async #readFileTables() {
        this.entries = {};

        let mypHeader = this.data.read(36);
        const magic = mypHeader.readUint32();
        if (magic !== 0x50594D) throw new Error(`ARCHIVEERROR at indexidx: ${this.idx}. Not a .tor file (Wrong file header)`);
        
        this.version = mypHeader.readUint32();
        if (this.version !== 5) throw new Error(`ARCHIVEERROR at indexidx: ${this.idx}. Only version 5 is supported, file has ${this.version}`);
        
        this.bom = mypHeader.readUint32()
        if (this.bom !== 0xFD23EC43) throw new Error(`ARCHIVEERROR at indexidx: ${this.idx}. Unexpected byte order`);

        let tableOffset = mypHeader.readUint64();
        if (tableOffset === 0) throw new Error(`ARCHIVEERROR at indexidx: ${this.idx}. File is empty`);

        this.tableCapacity = mypHeader.readUint32();
        this.totalFiles = mypHeader.readUint32();

        mypHeader.readUint32();
        mypHeader.readUint32();

        while (tableOffset != 0n) {
            this.data.seek(tableOffset, 0);

            const fileTableHeader = this.data.read(12);
            const numFiles = fileTableHeader.readUint32();

            tableOffset = fileTableHeader.readUint64();

            const fileTable = this.data.read(numFiles * 34);
            const table = new ArchiveEntryTable(numFiles, tableOffset);
            const tableIdx = this.tables.length;
            this.tables.push(table);

            for (let i = 0; i < numFiles; i++) {
                let offset = fileTable.readUint64();
                if (offset === 0) {
                    fileTable.seek(26, 1);
                    continue;
                }

                const headerSize = fileTable.readUint32();

                const comprSize = fileTable.readUint32();
                const uncomprSize = fileTable.readUint32();

                const reOff = fileTable.offset;

                const sh = fileTable.readUint32();
                const ph = fileTable.readUint32();

                fileTable.seek(reOff, 0);

                const fileId = fileTable.readUint64();
                const crc = fileTable.readUint32();

                const compression = fileTable.readUint16();
                const fileObj = new ArchiveEntry(
                    offset,
                    headerSize,
                    (compression !== 0) ? comprSize : 0,
                    uncomprSize,
                    crc,
                    compression !== 0,
                    ph,
                    sh,
                    fileId,
                    tableIdx,
                    i,
                    this.file
                );

                const hash = fileObj.sh + '|' + fileObj.ph;
                this.entries[hash] = fileObj;
            }
        }
    }
}

export {Archive, ArchiveEntry, FileExtension};