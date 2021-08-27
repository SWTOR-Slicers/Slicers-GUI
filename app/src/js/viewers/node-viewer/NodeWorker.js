import { hashlittle2, uint64 } from "../../Util.js";

const path = require('path');
const { promises: { readFile } } = require('fs');

onmessage = (e) => {
    switch (e.data.message) {
        case "loadNodes":
            loadNodes(e.data.data)
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

function loadNodes(torPath) {
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
                fileObj.name = undefined;
                const hash = sh + '|' + ph;
                
                gomArchive.files[hash] = fileObj
            }
        }

        if (Object.keys(gomArchive.files).length > 0) {
            loadGom(gomArchive, data, torPath);
        }
    }).catch(err => {
        throw err;
    });
}

function loadGom(gomArchive, data, torPath) {
    for (let i = 0; i < 500; i++) {
        const hashArr = hashlittle2(`/resources/systemgenerated/buckets/${i}.bkt`);
        const file = gomArchive.files[`${hashArr[1]}|${hashArr[0]}`];

        if (file) {
            const blob = data.slice(file.offset, file.offset + file.size);
            loadBucket(i, new DataView(blob), torPath, file);
        }
    }
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