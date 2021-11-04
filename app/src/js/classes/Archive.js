const { promises: { readFile }, readFileSync, existsSync, mkdirSync } = require('fs');
const path = require('path');

class ArchiveEntryTable {
    constructor(capacity, offset) {
        this.capacity = capacity;
        this.offset = offset;
    }
}

class ArchiveEntry {
    constructor(offset, metaDataSize, comprSize, uncomprSize, metaDataCheckSum, comprType, ph, sh, fileTableNum, fileTableFileIdx) {
        this.offset = offset;
        this.metaDataSize = metaDataSize;
        this.comprSize = comprSize;
        this.uncomprSize = uncomprSize;
        this.metaDataCheckSum = metaDataCheckSum;
        this.comprType = comprType;
        this.ph = ph;
        this.sh = sh;
        this.fileTableNum = fileTableNum;
        this.fileTableFileIdx = fileTableFileIdx;
    }
}

class Archive {
    constructor(file, idx) {
        this.file = file;
        this.idx = idx;
        this.tables = {};
        this.entries = {};
    }

    async load() {
        readFile(this.file).then(buff => {
            const fileName = path.basename(this.file);
            const data = buff.buffer;
            const dv = new DataView(data);
                
            let ftOffset = 0;
            let ftCapacity = 1000;
            if (dv.getUint32(0, !0) !== 0x50594d) throw new Error(`ARCHIVEERROR at indexidx: ${this.idx}. Not a .tor file (Wrong file header)`);
            if (dv.getUint32(4, !0) !== 5) throw new Error(`ARCHIVEERROR at indexidx: ${this.idx}. Only version 5 is supported, file has ${dv.getUint32(4, true)}`);
            if (dv.getUint32(8, !0) !== 0xFD23EC43) throw new Error(`ARCHIVEERROR at indexidx: ${this.idx}. Unexpected byte order`);

            ftOffset = datView.getUint32(12, !0);
            if (ftOffset === 0) throw new Error(`ARCHIVEERROR at indexidx: ${this.idx}. File is empty`);

            while (ftOffset != 0) {
                const blob = data.slice(ftOffset, ftOffset + 12 + ftCapacity * 34);
                const dv = new DataView(blob);

                const newCapacity = dv.getUint32(0, !0);
                if (newCapacity !== ftCapacity) {
                    console.error('Expected capacity of' + ftCapacity + 'but saw capacity' + newCapacity + 'in' + fileName);
                    ftCapacity = newCapacity;
                    break;
                }

                const table = new ArchiveEntryTable(ftCapacity, ftOffset);
                const tableIdx = Object.values().length;
                this.tables[tableIdx] = table;

                ftOffset = dv.getUint32(4, !0);

                for (let i = 12, c = 12 + ftCapacity * 34; i < c; i += 34) {
                    let offset = dv.getUint32(i, !0);
                    if (offset === 0) continue;
                    const headerSize = dv.getUint32(i+4, true);
                    offset += dv.getUint32(i + 8, !0);

                    const comprSize = dv.getUint32(i + 12, !0);
                    const uncomprSize = dv.getUint32(i + 16, !0);
                    const sh = dv.getUint32(i + 20, !0);
                    const ph = dv.getUint32(i + 24, !0);
                    const crc = dv.getUint32(i + 28, true);

                    if (sh === 0xC75A71E6 && ph === 0xE4B96113) continue;
                    if (sh === 0xCB34F836 && ph === 0x8478D2E1) continue;
                    if (sh === 0x02C9CF77 && ph === 0xF077E262) continue;

                    const compression = dv.getUint8(i + 32);
                    const fileObj = new ArchiveEntry();
                    fileObj.sh = sh;
                    fileObj.ph = ph;
                    fileObj.offset = offset;
                    fileObj.metaDataSize = headerSize;
                    fileObj.uncomprSize = uncomprSize;
                    fileObj.comprSize = (compression !== 0) ? comprSize : 0;
                    fileObj.isCompressed = compression !== 0;
                    fileObj.metaDataCheckSum = crc;
                    fileObj.name = undefined;
                    fileObj.fileTableNum = tableIdx;
                    fileObj.fileTableFileIdx = (i - 12) / 34;

                    const hash = sh + '|' + ph;
                    this.entries[hash] = fileObj;
                }
            }
        });
    }
}

export {Archive};