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

class ArchiveEntry {
    constructor(offset, metaDataSize, comprSize, uncomprSize, metaDataCheckSum, isCompr, ph, sh, fileId, fileTableNum, fileTableFileIdx, torPath) {
        this.offset = offset;

        this.metaDataSize = metaDataSize;
        this.metaDataCheckSum = metaDataCheckSum;

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
        return new ArchiveEntry(json.offset, json.metaDataSize, json.comprSize, json.uncomprSize, json.metaDataCheckSum, json.isCompr, json.ph, json.sh, json.fileId, json.fileTableNum, json.fileTableFileIdx, json.torPath);
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
        // const testBuf = this.data.read(this.data.length);
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
            // testBuf.seek(tableOffset, 0);

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
                    fileTable.seek(0x22, 1);
                    continue;
                }

                const headerSize = fileTable.readUint32();

                const comprSize = fileTable.readUint32();
                const uncomprSize = fileTable.readUint32();

                const reOff = fileTable.offset;
                const fileId = fileTable.readUint64();
                fileTable.seek(reOff, 0);

                const sh = fileTable.readUint32();
                const ph = fileTable.readUint32();
                const crc = fileTable.readUint32();

                const compression = fileTable.readUint8();
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

export {Archive, ArchiveEntry};