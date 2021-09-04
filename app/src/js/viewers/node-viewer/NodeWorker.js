import { RawDeflate } from "../../externals/Inflate.js";
import { hashlittle2, uint64, readString as readStr, readVarInt } from "../../Util.js";

const path = require('path');
const { inflateRawSync } = require('zlib');
const pako = require('pako');
const { promises: { readFile }, writeFileSync, readFileSync, existsSync, mkdirSync, unlinkSync } = require('fs');

const cache = {
    "configPath": "",
    "tmpPath": "",
    "dump": {}
}
const bucketNames = [];
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
function ionicDecompress(path, data) {
    writeFileSync(path, data);
    postMessage({
        "message": 'decompressIonic',
        "data": path
    });
}

onmessage = (e) => {
    switch (e.data.message) {
        case "init":
            cache['configPath'] = path.normalize(path.join(e.data.data, "config.json"));
            break;
        case "loadNodes":
            loadNodes(e.data.data)
            break;
        case "decompressCompl":
            const decompressedPath = e.data.data;
            const resData = readFileSync(decompressedPath).buffer;
            unlinkSync(decompressedPath);
            const {gomArchive, data, torPath} = cache['dump'];
            loadBuckets(gomArchive, data, torPath, new DataView(resData))
            break;
    }
}

function readString(dv, pos) {
    let curChar = 0;
    let outName = '';
    while ((curChar = dv.getUint8(pos++)) !== 0) {
        outName += String.fromCharCode(curChar)
    }
    return outName
}

async function loadNodes(torPath) {
    cache['tmpPath'] = await getTmpFilePath();
    let ftOffset = 0;
    let firstLoop = true;
    const ftCapacity = 1000;
    const fileName = path.basename(torPath);

    const gomArchive = {
        "files": {
            /* format:
             * "hash": data
             */
        }
    }
    
    readFile(torPath).then(buff => {
        const data = buff.buffer;
        const datView = new DataView(data);
        ftOffset = datView.getUint32(12, !0);

        while (ftOffset != 0 || firstLoop) {
            if (firstLoop) firstLoop = false;
            const blob = data.slice(ftOffset, ftOffset + 12 + ftCapacity * 34);
            const dv = new DataView(blob);

            const newCapacity = dv.getUint32(0, !0);
            if (newCapacity !== ftCapacity) {
                console.error('Expected capacity of' + ftCapacity + 'but saw capacity' + newCapacity + 'in' + fileName);
                ftCapacity = newCapacity;
                break;
            }

            ftOffset = dv.getUint32(4, !0);

            for (let i = 12, c = 12 + ftCapacity * 34; i < c; i += 34) {
                let offset = dv.getUint32(i, !0);
                if (offset === 0)
                    continue;
                offset += dv.getUint32(i + 8, !0);
                const comprSize = dv.getUint32(i + 12, !0);
                const uncomprSize = dv.getUint32(i + 16, !0);
                const sh = dv.getUint32(i + 20, !0);
                const ph = dv.getUint32(i + 24, !0);
                if (sh === 0xC75A71E6 && ph === 0xE4B96113)
                    continue;
                if (sh === 0xCB34F836 && ph === 0x8478D2E1)
                    continue;
                if (sh === 0x02C9CF77 && ph === 0xF077E262)
                    continue;
                const compression = dv.getUint8(i + 32);
                const fileObj = {};
                fileObj.sh = sh;
                fileObj.ph = ph;
                fileObj.offset = offset;
                fileObj.size = uncomprSize;
                fileObj.comprSize = (compression !== 0) ? comprSize : 0;
                fileObj.isCompressed = compression !== 0;
                fileObj.name = undefined;
                const hash = sh + '|' + ph;
                
                gomArchive.files[hash] = fileObj
            }
        }

        if (Object.keys(gomArchive.files).length > 0) {
            loadClientGOM(gomArchive, data, torPath);
            loadGom(gomArchive, data, torPath);
            loadPrototypes(gomArchive, data, torPath);
        }
    }).catch(err => {
        throw err;
    });
}

function loadClientGOM(gomArchive, data, torPath) {

}

function readLengthPrefixString(dv, pos) {
    const strLength = readVarInt(dv, pos);

    return [readStr(dv.buffer, pos + strLength.len, strLength.intLo), strLength.len + strLength.intLo];
}

function loadBuckets(gomArchive, data, torPath, infoDV) {
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
        const file = gomArchive.files[`${hashArr[1]}|${hashArr[0]}`];

        if (file) {
            const blob = data.slice(file.offset, file.offset + file.size);
            loadBucket(i, new DataView(blob), torPath, file);
        }
    }
}


function loadGom(gomArchive, data, torPath) {
    const bucketInfoHash = hashlittle2(`/resources/systemgenerated/buckets.info`);
    const bucketInfoEntr = gomArchive.files[`${bucketInfoHash[1]}|${bucketInfoHash[0]}`];

    const dat = data.slice(bucketInfoEntr.offset, bucketInfoEntr.offset + (bucketInfoEntr.isCompressed ? bucketInfoEntr.comprSize : bucketInfoEntr.size));
    let blob = null;
    if (bucketInfoEntr.isCompressed) {
        cache['dump']['gomArchive'] = gomArchive;
        cache['dump']['data'] = data;
        cache['dump']['torPath'] = torPath;
        ionicDecompress(path.join(cache['tmpPath'], 'buckets.info'), new Uint8Array(dat));
    } else {
        blob = dat;
        const infoDV = new DataView(blob);
        loadBuckets(gomArchive, data, torPath, infoDV);
    }
}

function loadPrototypes(gomArchive, data, torPath) {

}

function loadPrototype() {

}

function loadBucket(bktIdx, dv, torPath, bktFile) {
    const magic = dv.getUint32(0, !0);
    if (magic !== 0x4B554250)
        return postMessage({
            "message": 'NODES',
            "data": []
        });
    const versionMajor = dv.getUint16(4, !0);
    const versionMinor = dv.getUint16(6, !0);
    if (versionMajor !== 2 || versionMinor !== 5)
        return postMessage({
            "message": 'NODES',
            "data": []
        });
    let pos = 8;
    const length = dv.byteLength - 12;
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
            const name = readString(dv, startOffset + nameOffset);
            const dataLength = tmpLength - dataOffset;
            const node = {};
            node.id = id;
            node.fqn = name;
            node.baseClass = baseClass;
            node.bkt = {...bktFile, "bktIdx": bktIdx};
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
    postMessage({
        "message": 'NODES',
        "data": nodes
    })
}