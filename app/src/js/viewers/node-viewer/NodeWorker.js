const { parentPort } = require("worker_threads");
const path = require('path');
const zlib = require('zlib');
const { promises: { readFile }, readFileSync, existsSync, mkdirSync } = require('fs');

const esmRequire = require("esm")(module/*, options*/);
const { hashlittle2, uint64, readString, readVarInt, uint32ToUint64 } = esmRequire("../../Util.js");
const { Archive } = esmRequire("../../classes/formats/Archive");

const cache = {
    "configPath": "",
    "tmpPath": "",
    "store": {}
}
let decompressZlib = function(data){
    const decompr = zlib.inflateSync(data.buffer, {
        level: zlib.constants.Z_BEST_COMPRESSION,
        maxOutputLength: data.dataLength
    });

    return decompr
};

parentPort.on("message", (data) => {
    switch (data.message) {
        case "init":
            cache['configPath'] = path.join(data.data, 'config.json');
            break;
        case "loadNodes":
            loadNodes(data.data);
            break;
    }
});

async function loadNodes(torPath) {
    cache['tmpPath'] = cache['tmpPath'] == "" ? await getTmpFilePath() : cache['tmpPath'];
    const fileName = path.basename(torPath);
    
    const archive = new Archive(torPath, 0, true);

    const bucketInfoHash = hashlittle2("/resources/systemgenerated/buckets.info");
    const bucketInfoEntr = archive.entries[uint32ToUint64(bucketInfoHash[0], bucketInfoHash[1])];

    if (bucketInfoEntr.isCompr) {
        const reader = bucketInfoEntr.getReadStream();
        
      cache['store']['gomArchive'] = archive;
      cache['store']['data'] = reader.data;
      cache['store']['torPath'] = torPath;
      
      const infoDV = new DataView(reader.data);
      loadBuckets(archive, reader.data, torPath, infoDV);
    } else {
        throw new Error("Expected BucketInfo file to be compressed!");
    }
}

async function findGom(gomArchive, data, torPath) {
    const bucketInfoHash = hashlittle2(`/resources/systemgenerated/buckets.info`);
    const bucketInfoEntr = gomArchive.files[uint32ToUint64(bucketInfoHash[0], bucketInfoHash[1])];

    const dat = data.slice(bucketInfoEntr.offset, bucketInfoEntr.offset + (bucketInfoEntr.isCompressed ? bucketInfoEntr.comprSize : bucketInfoEntr.size));
    if (bucketInfoEntr.isCompressed) {
        const decompressed = decompressZlib({
            buffer: Buffer.from(dat),
            dataLength: bucketInfoEntr.size
        });
        const infoDV = new DataView(decompressed.buffer);
        loadBuckets(gomArchive, data, torPath, infoDV);
    }
}
function loadBuckets(gomArchive, data, torPath, infoDV) {
    const bucketNames = [];
    let pos = 0x8;

    const c9 = new Uint8Array(infoDV.buffer, pos, 1)[0];
    pos++;
    if (c9 != 0xC9) {
        throw new Error(`Unexpected character in buckets.info @ offset 0x8 - expected 0xC9 found ${c9}`);
    }

    let numEntries = infoDV.getInt16(pos, false);
    pos += 2;

    for (var i = 0; i < numEntries; i++) {
        const res = readLengthPrefixString(infoDV, pos);
        const fileName = res[0];
        pos += res[1];
        bucketNames.push(fileName);
    }

    for (let i = 0; i < numEntries; i++) {
        const hashArr = hashlittle2(`/resources/systemgenerated/buckets/${bucketNames[i]}`);
        const file = gomArchive.entries[uint32ToUint64(hashArr[0], hashArr[1])];

        if (file) {
            const blob = file.getReadStream().data;
            loadBucket(i, new DataView(blob), torPath, file);
        }
    }
}
function loadBucket(bktIdx, dv, torPath, bktFile) {
    const magic = dv.getUint32(0, !0);
    if (magic !== 0x4B554250) {
        parentPort.postMessage({ "message": 'NODES', "data": [] });
        return;
    }
    const versionMajor = dv.getUint16(4, !0);
    const versionMinor = dv.getUint16(6, !0);
    if (versionMajor !== 2 || versionMinor !== 5 || versionMinor !== 6) {
        parentPort.postMessage({ "message": 'NODES', "data": [] });
        return;
    }
    let pos = 8;
    const length = dv.byteLength - 12;
    readAllItems(dv, pos, length, torPath, bktIdx, bktFile, true);
}
function readAllItems(dv, pos, length, torPath, bktIdx, bktFile, isBucket) {
    const nodes = [];
    while (pos < length) {
        const dblbLength = dv.getUint32(pos, !0);
        pos += 4;
        const dblbStartOffset = pos;
        const dblbMagic = dv.getUint32(pos, !0);
        pos += 4;
        const dblbVersion = dv.getUint32(pos, !0);
        pos += 4;
        while (dblbStartOffset + dblbLength - pos >= 4) {
            const startOffset = pos;
            const tmpLength = dv.getUint32(pos, !0);
            pos += 4;
            if (tmpLength === 0)
                break;
            pos += 4;
            const idLo = dv.getUint32(pos, !0);
            pos += 4;
            const idHi = dv.getUint32(pos, !0);
            pos += 4;
            const id = uint64(idLo, idHi);
            const type = dv.getUint16(pos, !0);
            pos += 2;
            const dataOffset = dv.getUint16(pos, !0);
            pos += 2;
            const nameOffset = dv.getUint16(pos, !0);
            pos += 2;
            pos += 2;
            const baseClassLo = dv.getUint32(pos, !0);
            pos += 4;
            const baseClassHi = dv.getUint32(pos, !0);
            pos += 4;
            const baseClass = uint64(baseClassLo, baseClassHi);
            pos += 8;
            const uncomprLength = dv.getUint16(pos, !0);
            pos += 2;
            pos += 2;
            const uncomprOffset = dv.getUint16(pos, !0);
            pos += 2;
            pos += 2;
            const streamStyle = dv.getUint8(pos++);
            const name = readStr(dv, startOffset + nameOffset);
            const dataLength = tmpLength - dataOffset;
            const node = {};
            node.id = id;
            node.fqn = name;
            node.baseClass = baseClass;
            if (isBucket) {
                node.bkt = {...bktFile, "bktIdx": bktIdx};
            } else {
                node.client = {...bktFile, "clientIdx": bktIdx};
            }
            node.isBucket = !0;
            node.dataOffset = startOffset + dataOffset;
            node.dataLength = dataLength;
            node.contentOffset = uncomprOffset - dataOffset;
            node.uncomprLength = uncomprLength;
            node.streamStyle = streamStyle;
            nodes.push({
                "node": node,
                "torPath": torPath
            });
            pos = dblbStartOffset + ((startOffset - dblbStartOffset + tmpLength + 7) & -8)
        }
    }
    parentPort.postMessage({
        "message": 'NODES',
        "data": nodes
    })
}

// Utility functions
function readStr(dv, pos) {
    let curChar = 0;
    let outName = '';
    while ((curChar = dv.getUint8(pos++)) !== 0) {
        outName += String.fromCharCode(curChar)
    }
    return outName
}
function readLengthPrefixString(dv, pos) {
    const strLength = readVarInt(dv, pos);
    return [readString(dv.buffer, pos + strLength.len, strLength.intLo), strLength.len + strLength.intLo];
}
async function getTmpFilePath() {
    let res = readFileSync(cache['configPath']);
    let jsonObj = await JSON.parse(res);
    const resPath = path.join(jsonObj['outputFolder'], 'tmp');
    if (!existsSync(resPath)) {
        mkdirSync(resPath, {
            recursive: true
        });
    }
    return resPath;
}