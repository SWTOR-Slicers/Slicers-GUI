const { parentPort } = require("worker_threads");
const path = require('path');
const zlib = require('zlib');
const fzstd = require('fzstd');
const { promises: { readFile }, readFileSync, existsSync, mkdirSync } = require('fs');

const esmRequire = require("esm")(module/*, options*/);
const { hashlittle2, uint64C, readString, readVarInt, uint32ToUint64 } = esmRequire("../../Util.js");
const { Archive } = esmRequire("../../classes/formats/Archive");

const SEND_INCR = 500;
const TOTAL_PROTS = 16650;

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

    const protInfoHash = hashlittle2("/resources/systemgenerated/prototypes.info");
    const protInfoEntr = archive.entries[uint32ToUint64(protInfoHash[0], protInfoHash[1])];

    if (protInfoEntr.isCompr) {
        const reader = protInfoEntr.getReadStream();
      
      const infoDV = new DataView(reader.data);
      loadPrototypes(archive, reader.data, torPath, infoDV);
    } else {
        throw new Error("Expected PrototypesInfo file to be compressed!");
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
            const file = gomArchive.entries[uint32ToUint64(hashArr[0], hashArr[1])];

            if (file) {
                let fData = null;
                if (file.isCompressed) {
                    const blob = file.getReadStream().data;
                    const decompressed = decompressZlib({
                        buffer: Buffer.from(blob),
                        dataLength: file.size
                    });
                    fData = decompressed.buffer;
                } else {
                    const blob = file.getReadStream().data;
                    fData = blob;
                }
                const node = loadPrototype(protId, new DataView(fData), file);
                prototypes.push({
                    "node": node,
                    "torPath": torPath
                });
                protoLoaded++;

                // This batches together prototype nodes so that we dont lag out the app by batching 16 thousand at once
                if (protoLoaded % SEND_INCR == 0 || protoLoaded == TOTAL_PROTS) {
                    parentPort.postMessage({
                        "message": 'PROTO',
                        "data": {
                            "nodes": prototypes,
                            "numLoaded": protoLoaded,
                            "total": TOTAL_PROTS
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