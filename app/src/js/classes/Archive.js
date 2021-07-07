
const fs = require('fs');
const path = require('path');

class ArchiveEntryTable {
    constructor(capacity, offset) {
        this.capacity = capacity;
        this.offset = offset;
    }
}

class ArchiveEntry {
    constructor(offset, metaDataSize, comprSize, uncomprSize, metaDataCheckSum, comprType, fileTableNum, fileTableFileIndex) {
        this.offset = offset;
        this.metaDataSize = metaDataSize;
        this.comprSize = comprSize;
        this.uncomprSize = uncomprSize;
        this.metaDataCheckSum = metaDataCheckSum;
        this.comprType = comprType;
        this.fileTableNum = fileTableNum;
        this.fileTableFileIndex = fileTableFileIndex;
    }
}

class Archive {
    constructor(fPath) {
        this.fPath = fPath;
        this.entries = {}
    }

    loadArchive() {

    }
}

export {Archive};