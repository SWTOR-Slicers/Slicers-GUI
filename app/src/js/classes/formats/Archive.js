import { FileWrapper, Reader } from '../util/FileWrapper.js';

const path = require('path');
const zlib = require('zlib');


class ArchiveEntryTable {
    constructor(capacity, offset) {
        this.capacity = capacity;
        this.offset = offset;
    }
}

class ArchiveEntry {
    constructor(offset, metaDataSize, comprSize, uncomprSize, metaDataCheckSum, comprType, ph, sh, fileId, fileTableNum, fileTableFileIdx, torPath) {
        this.offset = offset;

        this.metaDataSize = metaDataSize;
        this.metaDataCheckSum = metaDataCheckSum;

        this.comprSize = comprSize;
        this.uncomprSize = uncomprSize;
        this.comprType = comprType;

        this.fileId = fileId;
        this.ph = ph;
        this.sh = sh;

        this.fileTableNum = fileTableNum;
        this.fileTableFileIdx = fileTableFileIdx;

        this.torPath = torPath;
        this.tor = path.basename(this.torPath);
    }

    getReadStream() {
        const wrapper = new FileWrapper(this.torPath);

        wrapper.seek(this.offset, 0);
        const data = wrapper.read(this.comprSize).data;

        const decompr = zlib.inflateRawSync(data, {
            level: zlib.constants.Z_BEST_COMPRESSION
        });

        return new Reader(decompr);
    }
}

class Archive {
    constructor(file, idx, loadTables = false) {
        this.file = file;
        this.idx = idx;
        this.tables = [];
        this.entries = {};

        this.data = new FileWrapper(this.file);

        let mypHeader = this.data.read(0x24);
        const magic = mypHeader.readUint32();
        if (magic !== 0x50594d) throw new Error(`ARCHIVEERROR at indexidx: ${this.idx}. Not a .tor file (Wrong file header)`);
        
        this.version = mypHeader.readUint32();
        if (this.version !== 5) throw new Error(`ARCHIVEERROR at indexidx: ${this.idx}. Only version 5 is supported, file has ${this.version}`);
        
        this.bom = mypHeader.readUint32()
        if (this.bom !== 0xFD23EC43) throw new Error(`ARCHIVEERROR at indexidx: ${this.idx}. Unexpected byte order`);

        this.tableOffset = mypHeader.readUint64();
        if (this.tableOffset === 0) throw new Error(`ARCHIVEERROR at indexidx: ${this.idx}. File is empty`);

        this.tableCapacity = mypHeader.readUint32();
        this.totalFiles = mypHeader.readUint32();

        mypHeader.readUint32();
        mypHeader.readUint32();

        if (loadTables) {
            this.#readFileTables();
        }
    }

    async #readFileTables() {
        this.entries = {};
        while (this.tableOffset > 0n) {
            this.data.seek(this.tableOffset, 0);
            let fileTableHeader = this.data.read(0xC);
            const newTableCapacity = fileTableHeader.readUint32();
            if (newTableCapacity != this.tableCapacity) {
                console.log(`Expected newTableCapacity of ${newTableCapacity} to equal global table capacity of ${this.tableCapacity}, unless this is the last table.`);
                this.tableCapacity = newTableCapacity;
            }
            this.tableOffset = fileTableHeader.readUint64();

            let fileTable = this.data.read(this.tableCapacity * 0x22);
            const table = new ArchiveEntryTable(this.tableCapacity, this.tableOffset);
            const tableIdx = this.tables.length;
            this.tables.push(table);

            for (let i = 0; i < this.tableCapacity; i++) {
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
                fileTable.offset = reOff;

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