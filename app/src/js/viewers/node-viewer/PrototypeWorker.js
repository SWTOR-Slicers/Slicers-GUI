const { parentPort } = require("worker_threads");

const path = require('path');
const zlib = require('zlib');
const { promises: { readFile }, readFileSync, existsSync, mkdirSync } = require('fs');

const esmRequire = require("esm")(module/*, options*/);
const { hashlittle2, uint64C, readString, readVarInt, uint32ToUint64 } = esmRequire("../../Util.js");

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
    let ftOffset = 0;
    let firstLoop = true;
    const ftCapacity = 1000;
    const fileName = path.basename(torPath);
    const gomArchive = {
        "files": {}
    };
    
    readFile(torPath).then(async (buff) => {
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
                const fileId = dv.getBigUint64(i+20, true);
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
                fileObj.fileId = fileId;
                fileObj.offset = offset;
                fileObj.size = uncomprSize;
                fileObj.comprSize = (compression !== 0) ? comprSize : 0;
                fileObj.isCompressed = compression !== 0;
                fileObj.name = undefined;
                
                gomArchive.files[fileObj.fileId] = fileObj
            }
        }

        if (Object.keys(gomArchive.files).length > 0) {
            findPrototypes(gomArchive, data, torPath);
        }
    }).catch(err => {
        throw err;
    });
}

async function findPrototypes(gomArchive, data, torPath) {
    const protInfoHash = hashlittle2(`/resources/systemgenerated/prototypes.info`);
    const protInfoEntr = gomArchive.files[uint32ToUint64(protInfoHash[0], protInfoHash[1])];

    const dat = data.slice(protInfoEntr.offset, protInfoEntr.offset + (protInfoEntr.isCompressed ? protInfoEntr.comprSize : protInfoEntr.size));
    if (protInfoEntr.isCompressed) {
        const decompressed = decompressZlib({
            buffer: Buffer.from(dat),
            dataLength: protInfoEntr.size
        });
        const infoDV = new DataView(decompressed.buffer);
        loadPrototypes(gomArchive, data, torPath, infoDV);
    }
}
async function loadPrototypes(gomArchive, data, torPath, dv) {
    let pos = 0;

    const magicNum = dv.getInt32(pos, true);
    pos += 4;
    if (magicNum != 0x464E4950) {
        throw new Error("prototypes.info does not begin with PINF");
    }

    pos += 4; // Skip 4 bytes

    const res = readVarInt(dv, pos);
    const numPrototypes = uint64C(res);
    pos += res.len;

    let prototypes = [];
    let protoLoaded = 0;
    for (let i = 0; i < numPrototypes; i++) {
        const res = readVarInt(dv, pos);
        const protId = uint64C(res);
        pos += res.len;

        const flag = new Uint8Array(dv.buffer, pos, 1)[0];
        pos++;

        if (flag == 1) {
            const hashArr = hashlittle2(`/resources/systemgenerated/prototypes/${protId}.node`);
            const file = gomArchive.files[uint32ToUint64(hashArr[0], hashArr[1])];

            if (file) {
                let fData = null;
                if (file.isCompressed) {
                    const blob = data.slice(file.offset, file.offset + file.comprSize);
                    const decompressed = decompressZlib({
                        buffer: Buffer.from(blob),
                        dataLength: file.size
                    });
                    fData = decompressed.buffer;
                } else {
                    const blob = data.slice(file.offset, file.offset + file.size);
                    fData = blob;
                }
                const node = loadPrototype(protId, new DataView(fData), file);
                prototypes.push({
                    "node": node,
                    "torPath": torPath
                });
                protoLoaded++;

                // This batches together prototype nodes so that we dont lag out the app by batching 16 thousand at once
                if (protoLoaded % 500 == 0 || protoLoaded == 16650) {
                    parentPort.postMessage({
                        "message": 'PROTO',
                        "data": {
                            "nodes": prototypes,
                            "numLoaded": protoLoaded,
                            "total": 16650
                        }
                    });
                    prototypes = [];
                }
            }
        }
    }
}
function loadPrototype(id, dv, prototype) {
    let pos = 0;

    // Check PROT
    const magicNum = dv.getInt32(pos, true);
    pos += 4;
    if (magicNum != 0x544F5250) {
        console.log(magicNum, 0x544F5250);
        console.error(`PROT node ${id} does not begin with PROT`);
        return null
    }

    pos += 4; // Skip 4 bytes

    const node = {};
    node.id = dv.getBigUint64(pos, true);
    pos += 8;
    const nameLen = dv.getInt32(pos, true);
    pos += 4;
    node.fqn = readString(dv.buffer, pos, nameLen-1); //readString(dv, pos)
    pos += nameLen-1;
    pos++;

    pos++;

    pos += 4;

    pos += 4;
    
    pos += 4;

    node.baseClass = dv.getBigUint64(pos, true);
    pos += 8;

    pos += 8;

    node.objectSizeInFile = dv.getInt32(pos, true); // 0x24
    pos += 4;

    node.isCompressed = false;
    node.dataOffset = 20 + nameLen + 33; // 8 byte file header + node ID + nameLen + node name + 33 byte node header

    if (node.objectSizeInFile > 0) {
        node.dataLength = node.objectSizeInFile;
    } else {
        node.dataLength = 0;
    }

    node.proto = {
        "id": id,
        "data": prototype
    }
    node.isBucket = false;

    return node;
}

// Utility functions
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